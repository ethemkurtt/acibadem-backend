const Sohbet = require("../models/Sohbet");
const SohbetKisileri = require("../models/SohbetKisileri");
const Mesaj = require("../models/Mesaj");

// ✅ Sohbet oluştur
exports.createSohbet = async (req, res) => {
  try {
    const user = req.user; // authRequired middleware’den geliyor
    const { hedef_user_id, sohbet_tipi } = req.body;

    if (!hedef_user_id) {
      return res.status(400).json({ error: "hedef_user_id gerekli." });
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

    return res.status(201).json({
      message: "Sohbet başarıyla oluşturuldu.",
      sohbet: yeniSohbet,
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

    const yeniMesaj = await Mesaj.create({
      sohbet_id,
      user_id: user._id,
      message,
    });

    return res.status(201).json({
      message: "Mesaj gönderildi.",
      data: yeniMesaj,
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

    const mesajlar = await Mesaj.find({ sohbet_id })
      .populate("user_id", "name email")
      .sort({ time: 1 });

    return res.json(mesajlar);
  } catch (err) {
    console.error("❌ Mesajlar alınamadı:", err);
    return res.status(500).json({ error: "Mesajlar alınamadı.", details: err.message });
  }
};

// ✅ Kullanıcının sohbetlerini getir
exports.getMySohbets = async (req, res) => {
  try {
    const user = req.user;

    const sohbetler = await SohbetKisileri.find({ user_id: user._id })
      .populate({
        path: "sohbet_id",
        populate: { path: "baslatan_user_id", select: "name email" },
      })
      .populate("user_id", "name email");

    return res.json(sohbetler);
  } catch (err) {
    console.error("❌ Sohbetler alınamadı:", err);
    return res.status(500).json({ error: "Sohbetler alınamadı.", details: err.message });
  }
};
