const mongoose = require("mongoose");
const Sohbet = require("../models/Sohbet");
const SohbetKisileri = require("../models/SohbetKisileri");
const Mesaj = require("../models/Mesaj");
const User = require("../models/user.model");
const { sendMessageToRoom, sendNotificationToUser } = require("../utils/socketService");

// ✅ Kullanıcı ara (Yeni sohbet başlatmak için)
exports.searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUser = req.user;

    if (!search || search.trim().length < 2) {
      return res.status(400).json({ 
        error: "Arama terimi en az 2 karakter olmalı." 
      });
    }

    // Regex ile isim veya email'de ara (case-insensitive)
    const searchRegex = new RegExp(search.trim(), "i");

    const users = await User.find({
      _id: { $ne: currentUser._id }, // Kendisi hariç
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("_id name email role departman lokasyon") // Sadece gerekli alanlar
      .populate("departman", "name")
      .populate("lokasyon", "name")
      .limit(20) // Maksimum 20 sonuç
      .lean();

    return res.json({
      message: "Kullanıcılar başarıyla getirildi.",
      users,
      total: users.length,
    });
  } catch (err) {
    console.error("❌ Kullanıcı arama hatası:", err);
    return res.status(500).json({ 
      error: "Kullanıcı araması yapılamadı.", 
      details: err.message 
    });
  }
};

// ✅ Sohbet oluştur (Optimize edilmiş)
exports.createSohbet = async (req, res) => {
  try {
    const user = req.user;
    const currentUserId = new mongoose.Types.ObjectId(user._id);
    const { hedef_user_id, sohbet_tipi } = req.body;

    if (!hedef_user_id) {
      return res.status(400).json({ error: "hedef_user_id gerekli." });
    }

    // Hedef kullanıcının varlığını kontrol et
    const hedefUser = await User.findById(hedef_user_id).select("name email").lean();
    if (!hedefUser) {
      return res.status(404).json({ error: "Hedef kullanıcı bulunamadı." });
    }

    // Mevcut sohbet var mı kontrol et (duplicate önleme)
    const hedefUserObjectId = new mongoose.Types.ObjectId(hedef_user_id);

    const mevcutSohbet = await SohbetKisileri.aggregate([
      {
        $match: {
          user_id: { $in: [currentUserId, hedefUserObjectId] },
        },
      },
      {
        $group: {
          _id: "$sohbet_id",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: 2, // İki taraflı sohbet
        },
      },
    ]);

    if (mevcutSohbet.length > 0) {
      const sohbet = await Sohbet.findById(mevcutSohbet[0]._id)
        .populate("baslatan_user_id", "name email")
        .lean();

      return res.status(200).json({
        message: "Mevcut sohbet bulundu.",
        sohbet: {
          ...sohbet,
          is_existing: true,
        },
      });
    }

    // 1️⃣ Sohbet oluştur
    const yeniSohbet = await Sohbet.create({
      sohbet_tipi: sohbet_tipi || null,
      baslatan_user_id: user._id,
      baslatan_user_name: user.name,
      baslatan_user_email: user.email,
    });

    // 2️⃣ Sohbet kişileri ekle (batch insert)
    await SohbetKisileri.insertMany([
      {
        sohbet_id: yeniSohbet._id,
        user_id: currentUserId,
        user_name: user.name,
        user_email: user.email,
      },
      {
        sohbet_id: yeniSohbet._id,
        user_id: hedefUserObjectId,
        user_name: hedefUser.name,
        user_email: hedefUser.email,
      },
    ]);

    // 3️⃣ Response
    const sohbet = await Sohbet.findById(yeniSohbet._id)
      .populate("baslatan_user_id", "name email")
      .lean();

    // ⚡ REAL-TIME: Hedef kullanıcıya bildirim gönder
    sendNotificationToUser(hedef_user_id, "sohbet:new", {
      sohbet,
      message: `${user.name} size yeni bir sohbet başlattı.`,
      timestamp: new Date(),
    });

    return res.status(201).json({
      message: "Sohbet başarıyla oluşturuldu.",
      sohbet,
    });
  } catch (err) {
    console.error("❌ Sohbet oluşturulamadı:", err);
    return res.status(500).json({ error: "Sohbet oluşturulamadı.", details: err.message });
  }
};

// ✅ Mesaj gönder (Optimize edilmiş - WebSocket ile entegre)
exports.sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { sohbet_id, message } = req.body;

    if (!sohbet_id || !message) {
      return res.status(400).json({ error: "sohbet_id ve message zorunlu." });
    }

    // Kullanıcının bu sohbete katılımcı olup olmadığını kontrol et
    const sohbetKisi = await SohbetKisileri.findOne({
      sohbet_id: new mongoose.Types.ObjectId(sohbet_id),
      user_id: user._id,
    }).lean();

    if (!sohbetKisi) {
      return res.status(403).json({
        error: "Bu sohbete mesaj gönderme yetkiniz yok.",
      });
    }

    // Mesajı kaydet
    const yeniMesaj = await Mesaj.create({
      sohbet_id: new mongoose.Types.ObjectId(sohbet_id),
      user_id: user._id,
      message: message.trim(),
    });

    const mesajResponse = {
      _id: yeniMesaj._id,
      mesaj_id: yeniMesaj.mesaj_id,
      sohbet_id,
      message: yeniMesaj.message,
      time: yeniMesaj.time,
      read_at: null,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    // ⚡ REAL-TIME: WebSocket üzerinden mesajı gönder
    sendMessageToRoom(sohbet_id, "message:new", mesajResponse);

    // Sohbetteki diğer katılımcılara bildirim gönder
    const katilimcilar = await SohbetKisileri.find({ sohbet_id }).lean();
    for (const katilimci of katilimcilar) {
      const katilimciId = katilimci.user_id.toString();
      if (katilimciId !== user._id.toString()) {
        sendNotificationToUser(katilimciId, "notification:new_message", {
          sohbet_id,
          message: mesajResponse,
          notification: {
            title: `${user.name} yeni mesaj gönderdi`,
            body: message.substring(0, 100),
            timestamp: new Date(),
          },
        });
      }
    }

    return res.status(201).json({
      message: "Mesaj başarıyla gönderildi.",
      data: mesajResponse,
    });
  } catch (err) {
    console.error("❌ Mesaj gönderilemedi:", err);
    return res.status(500).json({ error: "Mesaj gönderilemedi.", details: err.message });
  }
};

// ✅ Sohbet mesajlarını getir (Optimize edilmiş - Pagination)
exports.getMessages = async (req, res) => {
  try {
    const { sohbet_id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Kullanıcının bu sohbete erişimi var mı kontrol et
    const sohbetKisi = await SohbetKisileri.findOne({
      sohbet_id: new mongoose.Types.ObjectId(sohbet_id),
      user_id: user._id,
    }).lean();

    if (!sohbetKisi) {
      return res.status(403).json({
        error: "Bu sohbete erişim yetkiniz yok.",
      });
    }

    // Toplam mesaj sayısı
    const total = await Mesaj.countDocuments({ sohbet_id });

    // Mesajları getir (pagination)
    const mesajlar = await Mesaj.find({ sohbet_id })
      .populate("user_id", "name email")
      .sort({ time: -1 }) // En yeni mesajlar önce
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Mesajları okundu olarak işaretle
    await Mesaj.updateMany(
      {
        sohbet_id,
        user_id: { $ne: user._id },
        read_at: null,
      },
      {
        read_at: new Date(),
        okunma_tarihi: new Date(),
      }
    );

    // Sıralamayı tersine çevir (eski -> yeni)
    mesajlar.reverse();

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      mesajlar: mesajlar.map((m) => ({
        _id: m._id,
        mesaj_id: m.mesaj_id,
        message: m.message,
        time: m.time,
        read_at: m.read_at,
        sender: {
          _id: m.user_id._id,
          name: m.user_id.name,
          email: m.user_id.email,
        },
      })),
    });
  } catch (err) {
    console.error("❌ Mesajlar alınamadı:", err);
    return res.status(500).json({ error: "Mesajlar alınamadı.", details: err.message });
  }
};

// ✅ Kullanıcının sohbetlerini getir (Optimize edilmiş - Aggregation)
exports.getMySohbets = async (req, res) => {
  try {
    const user = req.user;
    const userId = new mongoose.Types.ObjectId(user._id);

    // Aggregation pipeline ile optimize edilmiş sohbet listesi
    const sohbetler = await SohbetKisileri.aggregate([
      // 1. Kullanıcının katıldığı sohbetleri filtrele
      {
        $match: { user_id: userId },
      },
      // 2. Sohbet bilgilerini getir
      {
        $lookup: {
          from: "sohbets",
          localField: "sohbet_id",
          foreignField: "_id",
          as: "sohbet",
        },
      },
      { $unwind: "$sohbet" },
      // 3. Sohbetin tüm katılımcılarını getir
      {
        $lookup: {
          from: "sohbetkisileris",
          localField: "sohbet_id",
          foreignField: "sohbet_id",
          as: "katilimcilar",
        },
      },
      // 4. Son mesajı getir
      {
        $lookup: {
          from: "mesajs",
          let: { sohbet_id: "$sohbet_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$sohbet_id", "$$sohbet_id"] } } },
            { $sort: { time: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "sender",
              },
            },
            { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
          ],
          as: "son_mesaj",
        },
      },
      { $unwind: { path: "$son_mesaj", preserveNullAndEmptyArrays: true } },
      // 5. Okunmamış mesaj sayısını hesapla
      {
        $lookup: {
          from: "mesajs",
          let: { sohbet_id: "$sohbet_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sohbet_id", "$$sohbet_id"] },
                    { $ne: ["$user_id", userId] },
                    { $eq: ["$read_at", null] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "okunmamis",
        },
      },
      // 6. Response formatla
      {
        $project: {
          sohbet_id: "$sohbet._id",
          sohbet_tipi: "$sohbet.sohbet_tipi",
          katilimcilar: {
            $map: {
              input: {
                $filter: {
                  input: "$katilimcilar",
                  as: "k",
                  cond: { $ne: ["$$k.user_id", userId] },
                },
              },
              as: "k",
              in: {
                user_id: "$$k.user_id",
                name: "$$k.user_name",
                email: "$$k.user_email",
                joined_at: "$$k.joined_at",
              },
            },
          },
          son_mesaj: {
            $cond: {
              if: { $ne: ["$son_mesaj", null] },
              then: {
                mesaj_id: "$son_mesaj.mesaj_id",
                message: "$son_mesaj.message",
                time: "$son_mesaj.time",
                sender: {
                  _id: "$son_mesaj.sender._id",
                  name: "$son_mesaj.sender.name",
                },
              },
              else: null,
            },
          },
          okunmamis_mesaj_sayisi: {
            $ifNull: [{ $arrayElemAt: ["$okunmamis.count", 0] }, 0],
          },
          created_at: "$sohbet.createdAt",
          updated_at: "$sohbet.updatedAt",
        },
      },
      // 7. Sıralama (en son mesaj önce)
      { $sort: { "son_mesaj.time": -1 } },
    ]);

    return res.json({
      message: "Sohbetler başarıyla getirildi.",
      kullanici: {
        user_id: user._id,
        name: user.name,
        email: user.email,
      },
      sohbetler,
      toplam_sohbet: sohbetler.length,
    });
  } catch (err) {
    console.error("❌ Sohbetler alınamadı:", err);
    return res.status(500).json({ error: "Sohbetler alınamadı.", details: err.message });
  }
};

// ✅ Sohbet sil (Optimize edilmiş)
exports.deleteSohbet = async (req, res) => {
  try {
    const { sohbet_id } = req.params;
    const user = req.user;

    const sohbet = await Sohbet.findById(sohbet_id).lean();
    if (!sohbet) {
      return res.status(404).json({ error: "Sohbet bulunamadı." });
    }

    // Sadece başlatan silebilir
    if (sohbet.baslatan_user_id.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: "Sadece sohbeti başlatan kişi silebilir.",
      });
    }

    // Tüm ilişkili verileri sil (batch operations)
    await Promise.all([
      Mesaj.deleteMany({ sohbet_id }),
      SohbetKisileri.deleteMany({ sohbet_id }),
      Sohbet.deleteOne({ _id: sohbet_id }),
    ]);

    // ⚡ REAL-TIME: Sohbet odasına silindi bildirimi gönder
    sendMessageToRoom(sohbet_id, "sohbet:deleted", {
      sohbet_id,
      message: "Sohbet başlatan tarafından silindi.",
      deleted_at: new Date(),
    });

    return res.json({
      message: "Sohbet başarıyla silindi.",
      sohbet_id,
      deleted_at: new Date(),
    });
  } catch (err) {
    console.error("❌ Sohbet silinemedi:", err);
    return res.status(500).json({ error: "Sohbet silinemedi.", details: err.message });
  }
};

// ✅ Okunmamış mesaj sayısını getir (Optimize edilmiş)
exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;

    // Kullanıcının katıldığı sohbetleri bul
    const sohbetIds = await SohbetKisileri.find({ user_id: user._id })
      .distinct("sohbet_id")
      .lean();

    // Toplam okunmamış mesaj sayısı
    const count = await Mesaj.countDocuments({
      sohbet_id: { $in: sohbetIds },
      user_id: { $ne: user._id },
      read_at: null,
    });

    return res.json({
      unread_count: count,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ Okunmamış mesaj sayısı alınamadı:", err);
    return res.status(500).json({ error: "Okunmamış mesaj sayısı alınamadı.", details: err.message });
  }
};

// ✅ Mesajları toplu okundu işaretle (Optimize edilmiş)
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { sohbet_id } = req.body;
    const user = req.user;

    if (!sohbet_id) {
      return res.status(400).json({ error: "sohbet_id gerekli." });
    }

    // Mesajları okundu olarak işaretle
    const result = await Mesaj.updateMany(
      {
        sohbet_id: new mongoose.Types.ObjectId(sohbet_id),
        user_id: { $ne: user._id },
        read_at: null,
      },
      {
        read_at: new Date(),
        okunma_tarihi: new Date(),
      }
    );

    // ⚡ REAL-TIME: Sohbet odasına bildir
    sendMessageToRoom(sohbet_id, "messages:read_by", {
      sohbet_id,
      read_by: {
        _id: user._id,
        name: user.name,
      },
      count: result.modifiedCount,
      read_at: new Date(),
    });

    return res.json({
      message: "Mesajlar okundu olarak işaretlendi.",
      modified_count: result.modifiedCount,
      read_at: new Date(),
    });
  } catch (err) {
    console.error("❌ Mesajlar okundu işaretlenemedi:", err);
    return res.status(500).json({ error: "Mesajlar okundu işaretlenemedi.", details: err.message });
  }
};

