const Sohbet = require("../models/Sohbet");
const SohbetKisileri = require("../models/SohbetKisileri");
const Mesaj = require("../models/Mesaj");
const User = require("../models/user.model");

// ✅ Sohbet oluştur
exports.createSohbet = async (req, res) => {
  try {
    const user = req.user; // authRequired middleware'den geliyor
    const { hedef_user_id, sohbet_tipi } = req.body;

    if (!hedef_user_id) {
      return res.status(400).json({ error: "hedef_user_id gerekli." });
    }

    // Hedef kullanıcının varlığını kontrol et
    const hedefUser = await User.findById(hedef_user_id).select("name email");
    if (!hedefUser) {
      return res.status(404).json({ error: "Hedef kullanıcı bulunamadı." });
    }

    // 1️⃣ Sohbet oluştur
    const yeniSohbet = await Sohbet.create({
      sohbet_tipi: sohbet_tipi || null,
      baslatan_user_id: user._id,
    });

    // 2️⃣ Sohbet kişileri ekle (başlatan + hedef)
    await SohbetKisileri.insertMany([
      {
        sohbet_id: yeniSohbet.sohbet_id,
        user_id: user._id,
      },
      {
        sohbet_id: yeniSohbet.sohbet_id,
        user_id: hedef_user_id,
      },
    ]);

    // Populate ile kullanıcı bilgilerini getir
    const populatedSohbet = await Sohbet.findById(yeniSohbet._id)
      .populate("baslatan_user_id", "name email")
      .lean();

    return res.status(201).json({
      message: "Sohbet başarıyla oluşturuldu.",
      sohbet: {
        ...populatedSohbet,
        katilimcilar: [
          {
            user_id: user._id,
            name: user.name,
            email: user.email,
            role: "baslatan"
          },
          {
            user_id: hedef_user_id,
            name: hedefUser.name,
            email: hedefUser.email,
            role: "katilimci"
          }
        ]
      },
    });
  } catch (err) {
    console.error("❌ Sohbet oluşturulamadı:", err);
    return res.status(500).json({ error: "Sohbet oluşturulamadı.", details: err.message });
  }
};

// ✅ Sohbet mesajı gönder
exports.sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { sohbet_id, message } = req.body;

    if (!sohbet_id || !message) {
      return res.status(400).json({ error: "sohbet_id ve message zorunlu." });
    }

    // Kullanıcının bu sohbete katılımcı olup olmadığını kontrol et
    const sohbetKisi = await SohbetKisileri.findOne({ 
      sohbet_id, 
      user_id: user._id 
    });

    if (!sohbetKisi) {
      return res.status(403).json({ 
        error: "Bu sohbete mesaj gönderme yetkiniz yok." 
      });
    }

    // Sohbetin varlığını kontrol et
    const sohbet = await Sohbet.findOne({ sohbet_id });
    if (!sohbet) {
      return res.status(404).json({ 
        error: "Sohbet bulunamadı." 
      });
    }

    const yeniMesaj = await Mesaj.create({
      sohbet_id,
      user_id: user._id,
      message: message.trim(),
    });

    // Populate ile gönderen bilgilerini getir
    const populatedMesaj = await Mesaj.findById(yeniMesaj._id)
      .populate("user_id", "name email")
      .lean();

    return res.status(201).json({
      message: "Mesaj başarıyla gönderildi.",
      data: {
        mesaj_id: populatedMesaj.mesaj_id,
        message: populatedMesaj.message,
        time: populatedMesaj.time,
        okunma_tarihi: populatedMesaj.okunma_tarihi,
        sender: {
          user_id: populatedMesaj.user_id._id,
          name: populatedMesaj.user_id.name,
          email: populatedMesaj.user_id.email
        }
      },
    });
  } catch (err) {
    console.error("❌ Mesaj gönderilemedi:", err);
    return res.status(500).json({ error: "Mesaj gönderilemedi.", details: err.message });
  }
};

// ✅ Sohbet mesajlarını getir
exports.getMessages = async (req, res) => {
  try {
    const { sohbet_id } = req.params;
    const user = req.user;

    // Sohbetin varlığını ve kullanıcının katılımcı olup olmadığını kontrol et
    const sohbetKisi = await SohbetKisileri.findOne({ 
      sohbet_id, 
      user_id: user._id 
    });

    if (!sohbetKisi) {
      return res.status(403).json({ 
        error: "Bu sohbete erişim yetkiniz yok." 
      });
    }

    // Sohbet bilgilerini getir
    const sohbet = await Sohbet.findOne({ sohbet_id })
      .populate("baslatan_user_id", "name email")
      .lean();

    if (!sohbet) {
      return res.status(404).json({ 
        error: "Sohbet bulunamadı." 
      });
    }

    // Katılımcıları getir
    const katilimcilar = await SohbetKisileri.find({ sohbet_id })
      .populate("user_id", "name email")
      .lean();

    // Mesajları getir
    const mesajlar = await Mesaj.find({ sohbet_id })
      .populate("user_id", "name email")
      .sort({ time: 1 })
      .lean();

    // Mesajları okundu olarak işaretle (kendi mesajları hariç)
    await Mesaj.updateMany(
      { 
        sohbet_id, 
        user_id: { $ne: user._id },
        okunma_tarihi: null 
      },
      { okunma_tarihi: new Date() }
    );

    return res.json({
      message: "Mesajlar başarıyla getirildi.",
      sohbet: {
        sohbet_id: sohbet.sohbet_id,
        sohbet_tipi: sohbet.sohbet_tipi,
        baslatan_user: {
          user_id: sohbet.baslatan_user_id._id,
          name: sohbet.baslatan_user_id.name,
          email: sohbet.baslatan_user_id.email
        },
        katilimcilar: katilimcilar.map(k => ({
          user_id: k.user_id._id,
          name: k.user_id.name,
          email: k.user_id.email,
          joined_at: k.joined_at
        })),
        created_at: sohbet.createdAt,
        updated_at: sohbet.updatedAt
      },
      mesajlar: mesajlar.map(m => ({
        mesaj_id: m.mesaj_id,
        message: m.message,
        time: m.time,
        okunma_tarihi: m.okunma_tarihi,
        sender: {
          user_id: m.user_id._id,
          name: m.user_id.name,
          email: m.user_id.email
        }
      })),
      toplam_mesaj: mesajlar.length
    });
  } catch (err) {
    console.error("❌ Mesajlar alınamadı:", err);
    return res.status(500).json({ error: "Mesajlar alınamadı.", details: err.message });
  }
};

// ✅ Kullanıcının sohbetlerini getir
exports.getMySohbets = async (req, res) => {
  try {
    const user = req.user;

    // Kullanıcının katıldığı sohbetleri getir
    const sohbetKisileri = await SohbetKisileri.find({ user_id: user._id })
      .populate({
        path: "sohbet_id",
        populate: { path: "baslatan_user_id", select: "name email" },
      })
      .lean();

    // Her sohbet için detayları getir
    const sohbetlerWithDetails = await Promise.all(
      sohbetKisileri.map(async (sohbetKisi) => {
        const sohbet = sohbetKisi.sohbet_id;
        
        // Bu sohbetin tüm katılımcılarını getir
        const katilimcilar = await SohbetKisileri.find({ sohbet_id: sohbet.sohbet_id })
          .populate("user_id", "name email")
          .lean();

        // Son mesajı getir
        const sonMesaj = await Mesaj.findOne({ sohbet_id: sohbet.sohbet_id })
          .populate("user_id", "name")
          .sort({ time: -1 })
          .lean();

        // Okunmamış mesaj sayısını getir
        const okunmamisMesajSayisi = await Mesaj.countDocuments({
          sohbet_id: sohbet.sohbet_id,
          user_id: { $ne: user._id },
          okunma_tarihi: null
        });

        // Sohbet ettiği diğer kişileri bul (login olan kullanıcı hariç)
        const digerKatilimcilar = katilimcilar.filter(k => 
          k.user_id._id.toString() !== user._id.toString()
        );

        return {
          // Sohbet bilgileri
          sohbet_id: sohbet.sohbet_id,
          sohbet_tipi: sohbet.sohbet_tipi,
          
          // Login olan kullanıcı bilgileri
          ben: {
            user_id: user._id,
            name: user.name,
            email: user.email,
            role: "katilimci"
          },
          
          // Sohbeti başlatan kişi
          baslatan_user: {
            user_id: sohbet.baslatan_user_id._id,
            name: sohbet.baslatan_user_id.name,
            email: sohbet.baslatan_user_id.email,
            role: "baslatan"
          },
          
          // Sohbet ettiği diğer kişiler (login olan hariç)
          sohbet_ettigi_kisiler: digerKatilimcilar.map(k => ({
            user_id: k.user_id._id,
            name: k.user_id.name,
            email: k.user_id.email,
            joined_at: k.joined_at,
            role: "katilimci"
          })),
          
          // Tüm katılımcılar (detaylı bilgi için)
          tum_katilimcilar: katilimcilar.map(k => ({
            user_id: k.user_id._id,
            name: k.user_id.name,
            email: k.user_id.email,
            joined_at: k.joined_at,
            role: k.user_id._id.toString() === sohbet.baslatan_user_id._id.toString() ? "baslatan" : "katilimci"
          })),
          
          // Son mesaj bilgisi
          son_mesaj: sonMesaj ? {
            mesaj_id: sonMesaj.mesaj_id,
            message: sonMesaj.message,
            time: sonMesaj.time,
            sender: {
              user_id: sonMesaj.user_id._id,
              name: sonMesaj.user_id.name
            }
          } : null,
          
          // İstatistikler
          okunmamis_mesaj_sayisi: okunmamisMesajSayisi,
          toplam_katilimci: katilimcilar.length,
          
          // Tarih bilgileri
          created_at: sohbet.createdAt,
          updated_at: sohbet.updatedAt
        };
      })
    );

    return res.json({
      message: "Sohbetler başarıyla getirildi.",
      kullanici: {
        user_id: user._id,
        name: user.name,
        email: user.email
      },
      sohbetler: sohbetlerWithDetails,
      toplam_sohbet: sohbetlerWithDetails.length
    });
  } catch (err) {
    console.error("❌ Sohbetler alınamadı:", err);
    return res.status(500).json({ error: "Sohbetler alınamadı.", details: err.message });
  }
};

// ✅ Sohbet detaylarını getir
exports.getSohbetDetails = async (req, res) => {
  try {
    const { sohbet_id } = req.params;
    const user = req.user;

    // Kullanıcının bu sohbete katılımcı olup olmadığını kontrol et
    const sohbetKisi = await SohbetKisileri.findOne({ 
      sohbet_id, 
      user_id: user._id 
    });

    if (!sohbetKisi) {
      return res.status(403).json({ 
        error: "Bu sohbete erişim yetkiniz yok." 
      });
    }

    // Sohbet bilgilerini getir
    const sohbet = await Sohbet.findOne({ sohbet_id })
      .populate("baslatan_user_id", "name email")
      .lean();

    if (!sohbet) {
      return res.status(404).json({ 
        error: "Sohbet bulunamadı." 
      });
    }

    // Katılımcıları getir
    const katilimcilar = await SohbetKisileri.find({ sohbet_id })
      .populate("user_id", "name email")
      .lean();

    // Son mesajı getir
    const sonMesaj = await Mesaj.findOne({ sohbet_id })
      .populate("user_id", "name")
      .sort({ time: -1 })
      .lean();

    // Okunmamış mesaj sayısını getir
    const okunmamisMesajSayisi = await Mesaj.countDocuments({
      sohbet_id,
      user_id: { $ne: user._id },
      okunma_tarihi: null
    });

    // Sohbet ettiği diğer kişileri bul (login olan kullanıcı hariç)
    const digerKatilimcilar = katilimcilar.filter(k => 
      k.user_id._id.toString() !== user._id.toString()
    );

    return res.json({
      message: "Sohbet detayları başarıyla getirildi.",
      kullanici: {
        user_id: user._id,
        name: user.name,
        email: user.email
      },
      sohbet: {
        // Sohbet bilgileri
        sohbet_id: sohbet.sohbet_id,
        sohbet_tipi: sohbet.sohbet_tipi,
        
        // Login olan kullanıcı bilgileri
        ben: {
          user_id: user._id,
          name: user.name,
          email: user.email,
          role: "katilimci"
        },
        
        // Sohbeti başlatan kişi
        baslatan_user: {
          user_id: sohbet.baslatan_user_id._id,
          name: sohbet.baslatan_user_id.name,
          email: sohbet.baslatan_user_id.email,
          role: "baslatan"
        },
        
        // Sohbet ettiği diğer kişiler (login olan hariç)
        sohbet_ettigi_kisiler: digerKatilimcilar.map(k => ({
          user_id: k.user_id._id,
          name: k.user_id.name,
          email: k.user_id.email,
          joined_at: k.joined_at,
          role: "katilimci"
        })),
        
        // Tüm katılımcılar (detaylı bilgi için)
        tum_katilimcilar: katilimcilar.map(k => ({
          user_id: k.user_id._id,
          name: k.user_id.name,
          email: k.user_id.email,
          joined_at: k.joined_at,
          role: k.user_id._id.toString() === sohbet.baslatan_user_id._id.toString() ? "baslatan" : "katilimci"
        })),
        
        // Son mesaj bilgisi
        son_mesaj: sonMesaj ? {
          mesaj_id: sonMesaj.mesaj_id,
          message: sonMesaj.message,
          time: sonMesaj.time,
          sender: {
            user_id: sonMesaj.user_id._id,
            name: sonMesaj.user_id.name
          }
        } : null,
        
        // İstatistikler
        okunmamis_mesaj_sayisi: okunmamisMesajSayisi,
        toplam_katilimci: katilimcilar.length,
        
        // Tarih bilgileri
        created_at: sohbet.createdAt,
        updated_at: sohbet.updatedAt
      }
    });
  } catch (err) {
    console.error("❌ Sohbet detayları alınamadı:", err);
    return res.status(500).json({ error: "Sohbet detayları alınamadı.", details: err.message });
  }
};
