const mongoose = require("mongoose");
const Takvim = require("../models/takvim.model");
const User = require("../models/user.model");

// ✅ Takvim etkinliği oluştur
exports.createTakvimEtkinligi = async (req, res) => {
  try {
    const user = req.user;
    const { baslik, konu, baslangic_tarihi, bitis_tarihi, renk, hatirlatma, durum } = req.body;

    // Gerekli alanları kontrol et
    if (!baslik || !konu || !baslangic_tarihi || !bitis_tarihi) {
      return res.status(400).json({ 
        error: "Başlık, konu, başlangıç tarihi ve bitiş tarihi zorunludur." 
      });
    }

    // Tarih formatını kontrol et
    const baslangic = new Date(baslangic_tarihi);
    const bitis = new Date(bitis_tarihi);

    if (isNaN(baslangic.getTime()) || isNaN(bitis.getTime())) {
      return res.status(400).json({ 
        error: "Geçerli tarih formatı giriniz." 
      });
    }

    if (bitis < baslangic) {
      return res.status(400).json({ 
        error: "Bitiş tarihi başlangıç tarihinden önce olamaz." 
      });
    }

    // Takvim etkinliği oluştur
    const yeniEtkinlik = await Takvim.create({
      baslik: baslik.trim(),
      konu: konu.trim(),
      baslangic_tarihi: baslangic,
      bitis_tarihi: bitis,
      user_id: user._id,
      user_name: user.name,
      user_email: user.email,
      renk: renk || '#3b82f6',
      hatirlatma: hatirlatma ? new Date(hatirlatma) : null,
      durum: durum || 'aktif'
    });

    return res.status(201).json({
      message: "Takvim etkinliği başarıyla oluşturuldu.",
      etkinlik: {
        _id: yeniEtkinlik._id,
        baslik: yeniEtkinlik.baslik,
        konu: yeniEtkinlik.konu,
        baslangic_tarihi: yeniEtkinlik.baslangic_tarihi,
        bitis_tarihi: yeniEtkinlik.bitis_tarihi,
        renk: yeniEtkinlik.renk,
        hatirlatma: yeniEtkinlik.hatirlatma,
        durum: yeniEtkinlik.durum,
        user: {
          user_id: user._id,
          name: user.name,
          email: user.email
        },
        created_at: yeniEtkinlik.createdAt,
        updated_at: yeniEtkinlik.updatedAt
      }
    });
  } catch (err) {
    console.error("❌ Takvim etkinliği oluşturulamadı:", err);
    return res.status(500).json({ 
      error: "Takvim etkinliği oluşturulamadı.", 
      details: err.message 
    });
  }
};

// ✅ Kullanıcının takvim etkinliklerini getir
exports.getMyTakvimEtkinlikleri = async (req, res) => {
  try {
    const user = req.user;
    const { baslangic_tarihi, bitis_tarihi, durum, sayfa = 1, limit = 50 } = req.query;

    // Query oluştur
    let query = { user_id: user._id };

    // Tarih filtresi
    if (baslangic_tarihi && bitis_tarihi) {
      query.baslangic_tarihi = {
        $gte: new Date(baslangic_tarihi),
        $lte: new Date(bitis_tarihi)
      };
    } else if (baslangic_tarihi) {
      query.baslangic_tarihi = { $gte: new Date(baslangic_tarihi) };
    } else if (bitis_tarihi) {
      query.bitis_tarihi = { $lte: new Date(bitis_tarihi) };
    }

    // Durum filtresi
    if (durum && ['aktif', 'tamamlandi', 'iptal'].includes(durum)) {
      query.durum = durum;
    }

    // Sayfalama
    const skip = (parseInt(sayfa) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Takvim etkinliklerini getir
    const etkinlikler = await Takvim.find(query)
      .sort({ baslangic_tarihi: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Toplam sayıyı getir
    const toplamSayi = await Takvim.countDocuments(query);

    return res.json({
      message: "Takvim etkinlikleri başarıyla getirildi.",
      kullanici: {
        user_id: user._id,
        name: user.name,
        email: user.email
      },
      etkinlikler: etkinlikler.map(etkinlik => ({
        _id: etkinlik._id,
        baslik: etkinlik.baslik,
        konu: etkinlik.konu,
        baslangic_tarihi: etkinlik.baslangic_tarihi,
        bitis_tarihi: etkinlik.bitis_tarihi,
        renk: etkinlik.renk,
        hatirlatma: etkinlik.hatirlatma,
        durum: etkinlik.durum,
        user: {
          user_id: etkinlik.user_id,
          name: etkinlik.user_name,
          email: etkinlik.user_email
        },
        created_at: etkinlik.createdAt,
        updated_at: etkinlik.updatedAt
      })),
      sayfalama: {
        sayfa: parseInt(sayfa),
        limit: limitNum,
        toplam_sayi: toplamSayi,
        toplam_sayfa: Math.ceil(toplamSayi / limitNum)
      }
    });
  } catch (err) {
    console.error("❌ Takvim etkinlikleri alınamadı:", err);
    return res.status(500).json({ 
      error: "Takvim etkinlikleri alınamadı.", 
      details: err.message 
    });
  }
};

// ✅ Takvim etkinliği detayını getir
exports.getTakvimEtkinligiDetay = async (req, res) => {
  try {
    const { etkinlik_id } = req.params;
    const user = req.user;

    if (!etkinlik_id) {
      return res.status(400).json({ error: "Etkinlik ID gerekli." });
    }

    // Etkinliği getir
    const etkinlik = await Takvim.findOne({ 
      _id: etkinlik_id, 
      user_id: user._id 
    }).lean();

    if (!etkinlik) {
      return res.status(404).json({ 
        error: "Takvim etkinliği bulunamadı veya erişim yetkiniz yok." 
      });
    }

    return res.json({
      message: "Takvim etkinliği detayı başarıyla getirildi.",
      etkinlik: {
        _id: etkinlik._id,
        baslik: etkinlik.baslik,
        konu: etkinlik.konu,
        baslangic_tarihi: etkinlik.baslangic_tarihi,
        bitis_tarihi: etkinlik.bitis_tarihi,
        renk: etkinlik.renk,
        hatirlatma: etkinlik.hatirlatma,
        durum: etkinlik.durum,
        user: {
          user_id: etkinlik.user_id,
          name: etkinlik.user_name,
          email: etkinlik.user_email
        },
        created_at: etkinlik.createdAt,
        updated_at: etkinlik.updatedAt
      }
    });
  } catch (err) {
    console.error("❌ Takvim etkinliği detayı alınamadı:", err);
    return res.status(500).json({ 
      error: "Takvim etkinliği detayı alınamadı.", 
      details: err.message 
    });
  }
};

// ✅ Takvim etkinliğini güncelle
exports.updateTakvimEtkinligi = async (req, res) => {
  try {
    const { etkinlik_id } = req.params;
    const user = req.user;
    const { baslik, konu, baslangic_tarihi, bitis_tarihi, renk, hatirlatma, durum } = req.body;

    if (!etkinlik_id) {
      return res.status(400).json({ error: "Etkinlik ID gerekli." });
    }

    // Etkinliğin varlığını kontrol et
    const mevcutEtkinlik = await Takvim.findOne({ 
      _id: etkinlik_id, 
      user_id: user._id 
    });

    if (!mevcutEtkinlik) {
      return res.status(404).json({ 
        error: "Takvim etkinliği bulunamadı veya erişim yetkiniz yok." 
      });
    }

    // Güncelleme verilerini hazırla
    const guncellemeVerisi = {};

    if (baslik !== undefined) guncellemeVerisi.baslik = baslik.trim();
    if (konu !== undefined) guncellemeVerisi.konu = konu.trim();
    if (renk !== undefined) guncellemeVerisi.renk = renk;
    if (durum !== undefined && ['aktif', 'tamamlandi', 'iptal'].includes(durum)) {
      guncellemeVerisi.durum = durum;
    }
    if (hatirlatma !== undefined) {
      guncellemeVerisi.hatirlatma = hatirlatma ? new Date(hatirlatma) : null;
    }

    // Tarih güncellemeleri
    if (baslangic_tarihi !== undefined) {
      const baslangic = new Date(baslangic_tarihi);
      if (isNaN(baslangic.getTime())) {
        return res.status(400).json({ error: "Geçerli başlangıç tarihi formatı giriniz." });
      }
      guncellemeVerisi.baslangic_tarihi = baslangic;
    }

    if (bitis_tarihi !== undefined) {
      const bitis = new Date(bitis_tarihi);
      if (isNaN(bitis.getTime())) {
        return res.status(400).json({ error: "Geçerli bitiş tarihi formatı giriniz." });
      }
      guncellemeVerisi.bitis_tarihi = bitis;
    }

    // Tarih tutarlılığını kontrol et
    const finalBaslangic = guncellemeVerisi.baslangic_tarihi || mevcutEtkinlik.baslangic_tarihi;
    const finalBitis = guncellemeVerisi.bitis_tarihi || mevcutEtkinlik.bitis_tarihi;

    if (finalBitis < finalBaslangic) {
      return res.status(400).json({ 
        error: "Bitiş tarihi başlangıç tarihinden önce olamaz." 
      });
    }

    // Etkinliği güncelle
    const guncellenmisEtkinlik = await Takvim.findByIdAndUpdate(
      etkinlik_id,
      guncellemeVerisi,
      { new: true, runValidators: true }
    ).lean();

    return res.json({
      message: "Takvim etkinliği başarıyla güncellendi.",
      etkinlik: {
        _id: guncellenmisEtkinlik._id,
        baslik: guncellenmisEtkinlik.baslik,
        konu: guncellenmisEtkinlik.konu,
        baslangic_tarihi: guncellenmisEtkinlik.baslangic_tarihi,
        bitis_tarihi: guncellenmisEtkinlik.bitis_tarihi,
        renk: guncellenmisEtkinlik.renk,
        hatirlatma: guncellenmisEtkinlik.hatirlatma,
        durum: guncellenmisEtkinlik.durum,
        user: {
          user_id: guncellenmisEtkinlik.user_id,
          name: guncellenmisEtkinlik.user_name,
          email: guncellenmisEtkinlik.user_email
        },
        created_at: guncellenmisEtkinlik.createdAt,
        updated_at: guncellenmisEtkinlik.updatedAt
      }
    });
  } catch (err) {
    console.error("❌ Takvim etkinliği güncellenemedi:", err);
    return res.status(500).json({ 
      error: "Takvim etkinliği güncellenemedi.", 
      details: err.message 
    });
  }
};

// ✅ Takvim etkinliğini sil
exports.deleteTakvimEtkinligi = async (req, res) => {
  try {
    const { etkinlik_id } = req.params;
    const user = req.user;

    if (!etkinlik_id) {
      return res.status(400).json({ error: "Etkinlik ID gerekli." });
    }

    // Etkinliğin varlığını kontrol et
    const etkinlik = await Takvim.findOne({ 
      _id: etkinlik_id, 
      user_id: user._id 
    });

    if (!etkinlik) {
      return res.status(404).json({ 
        error: "Takvim etkinliği bulunamadı veya erişim yetkiniz yok." 
      });
    }

    // Etkinliği sil
    await Takvim.findByIdAndDelete(etkinlik_id);

    return res.json({
      message: "Takvim etkinliği başarıyla silindi.",
      etkinlik_id: etkinlik_id,
      deleted_at: new Date()
    });
  } catch (err) {
    console.error("❌ Takvim etkinliği silinemedi:", err);
    return res.status(500).json({ 
      error: "Takvim etkinliği silinemedi.", 
      details: err.message 
    });
  }
};

// ✅ Kullanıcının tüm takvim etkinliklerini sil
exports.deleteAllMyTakvimEtkinlikleri = async (req, res) => {
  try {
    const user = req.user;

    // Kullanıcının tüm etkinliklerini sil
    const silinenSayi = await Takvim.deleteMany({ user_id: user._id });

    return res.json({
      message: "Tüm takvim etkinlikleri başarıyla silindi.",
      silinen_etkinlik_sayisi: silinenSayi.deletedCount,
      deleted_at: new Date()
    });
  } catch (err) {
    console.error("❌ Takvim etkinlikleri silinemedi:", err);
    return res.status(500).json({ 
      error: "Takvim etkinlikleri silinemedi.", 
      details: err.message 
    });
  }
};

// ✅ Yaklaşan etkinlikleri getir
exports.getYaklasanEtkinlikler = async (req, res) => {
  try {
    const user = req.user;
    const { gun_sayisi = 7 } = req.query;

    const bugun = new Date();
    const gelecekTarih = new Date();
    gelecekTarih.setDate(bugun.getDate() + parseInt(gun_sayisi));

    // Yaklaşan etkinlikleri getir
    const yaklasanEtkinlikler = await Takvim.find({
      user_id: user._id,
      baslangic_tarihi: {
        $gte: bugun,
        $lte: gelecekTarih
      },
      durum: 'aktif'
    })
    .sort({ baslangic_tarihi: 1 })
    .lean();

    return res.json({
      message: "Yaklaşan etkinlikler başarıyla getirildi.",
      kullanici: {
        user_id: user._id,
        name: user.name,
        email: user.email
      },
      etkinlikler: yaklasanEtkinlikler.map(etkinlik => ({
        _id: etkinlik._id,
        baslik: etkinlik.baslik,
        konu: etkinlik.konu,
        baslangic_tarihi: etkinlik.baslangic_tarihi,
        bitis_tarihi: etkinlik.bitis_tarihi,
        renk: etkinlik.renk,
        hatirlatma: etkinlik.hatirlatma,
        durum: etkinlik.durum,
        kalan_gun: Math.ceil((etkinlik.baslangic_tarihi - bugun) / (1000 * 60 * 60 * 24)),
        created_at: etkinlik.createdAt,
        updated_at: etkinlik.updatedAt
      })),
      toplam_etkinlik: yaklasanEtkinlikler.length,
      gun_sayisi: parseInt(gun_sayisi)
    });
  } catch (err) {
    console.error("❌ Yaklaşan etkinlikler alınamadı:", err);
    return res.status(500).json({ 
      error: "Yaklaşan etkinlikler alınamadı.", 
      details: err.message 
    });
  }
};
