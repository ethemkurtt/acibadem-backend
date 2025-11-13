const XLSX = require("xlsx");
const path = require("path");
const Lokasyon = require("../models/lokasyon.model");
const mongoose = require("mongoose");

// ⚡ Cache invalidation için
const dataLoader = require("../utils/dataLoader");

// 🟢 Excel'den toplu lokasyon yükleme
exports.importLokasyonlar = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const pick = (row, keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && String(row[k]).trim() !== "") return String(row[k]).trim();
      }
      return "";
    };
    const CITY_NAME_KEYS = ["İL", "IL", "ŞEHİR", "SEHIR", "İL ADI", "IL ADI", "CITY"];
    const CITY_ID_KEYS   = ["İL KODU", "PLAKA", "PLAKA KODU", "IL KODU", "SEHIR KODU"];

    const lokasyonSet = new Set();
    rows.forEach(row => {
      if (row["LOKASYON"]) lokasyonSet.add(String(row["LOKASYON"]).trim());
    });

    const lokasyonArray = [];
    rows.forEach(row => {
      const ad = row["LOKASYON"] ? String(row["LOKASYON"]).trim() : "";
      if (!ad || !lokasyonSet.has(ad)) return;
      lokasyonSet.delete(ad);

      const sehirName = pick(row, CITY_NAME_KEYS);
      const sehirIdRaw = pick(row, CITY_ID_KEYS);
      const sehirIdNum = sehirIdRaw ? parseInt(sehirIdRaw, 10) : undefined;
      const sehirId = Number.isNaN(sehirIdNum) ? undefined : sehirIdNum;

      const doc = { ad };
      if (sehirName) doc.sehirName = sehirName;
      if (sehirId)   doc.sehirId = sehirId;

      lokasyonArray.push(doc);
    });

    const result = await Lokasyon.insertMany(lokasyonArray, { ordered: false });

    return res.json({
      message: "Lokasyonlar başarıyla yüklendi",
      data: { count: result.length }
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Bazı lokasyonlar zaten kayıtlı",
        data: { error: err.message }
      });
    }
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm lokasyonları getir
exports.getAllLokasyonlar = async (req, res) => {
  try {
    const lokasyonlar = await Lokasyon.find().sort({ ad: 1 });
    return res.json({
      message: "Lokasyonlar başarıyla getirildi",
      data: lokasyonlar
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm lokasyonları sil
exports.deleteAllLokasyonlar = async (req, res) => {
  try {
    const result = await Lokasyon.deleteMany({});
    return res.json({
      message: "Tüm lokasyonlar silindi",
      data: { deletedCount: result.deletedCount }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Toplu silme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Kısmi güncelle (PATCH)
exports.patchLokasyon = async (req, res) => {
  try {
    const updated = await Lokasyon.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Lokasyon bulunamadı",
        data: null
      });
    }

    // ⚡ Cache'i temizle (fire and forget)
    dataLoader.invalidateLokasyon(req.params.id).catch(() => {});

    return res.json({
      message: "Lokasyon başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      message: "Kısmi güncelleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Lokasyon oluştur
exports.createLokasyon = async (req, res) => {
  try {
    const { ad, il_kodu = "", ilce_kodu = "" } = req.body;

    if (!ad || ad.trim() === "") {
      return res.status(400).json({
        message: "Lokasyon adı gereklidir.",
        data: null
      });
    }

    // İsteğin gönderdiği alanları kayda geç
    const yeniLokasyon = await Lokasyon.create({
      ad: ad.trim(),
      il_kodu: String(il_kodu),
      ilce_kodu: String(ilce_kodu)
    });

    // ⚡ Cache'e ekle (fire and forget)
    dataLoader.invalidateLokasyon(yeniLokasyon._id).catch(() => {});

    return res.status(201).json({
      message: "Lokasyon başarıyla oluşturuldu",
      data: yeniLokasyon
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Bu lokasyon zaten kayıtlı.",
        data: { error: err.message }
      });
    }
    return res.status(500).json({
      message: "Lokasyon eklenemedi",
      data: { error: err.message }
    });
  }
};


// 🟢 ID ile lokasyon getir
exports.getLokasyonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Geçersiz lokasyon ID formatı.",
        data: null
      });
    }

    const doc = await Lokasyon.findById(id);
    if (!doc) {
      return res.status(404).json({
        message: "Lokasyon bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Lokasyon başarıyla getirildi",
      data: doc
    });
  } catch (err) {
    return res.status(500).json({
      message: "Lokasyon getirilemedi",
      data: { error: err.message }
    });
  }
};
