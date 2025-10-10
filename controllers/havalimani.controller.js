const XLSX = require("xlsx");
const path = require("path");
const Havalimani = require("../models/havalimanı/havalimani.model");

// 🟢 Excel'den toplu veri yükleme
exports.importHavalimanlari = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Havalimanı Listesi"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const mapped = rows.map((row) => ({
      adi: row["HAVALİMANI ADI"],
      sehir: row["BULUNDUĞU YER"],
    }));

    const inserted = await Havalimani.insertMany(mapped);

    return res.json({
      message: "Havalimanları başarıyla yüklendi",
      data: { count: inserted.length }
    });
  } catch (err) {
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm havalimanlarını getir
exports.getAllHavalimanlari = async (req, res) => {
  try {
    const havalimanlari = await Havalimani.find().sort({ adi: 1 });
    return res.json({
      message: "Havalimanları başarıyla getirildi",
      data: havalimanlari
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tek havalimanı getir
exports.getOneHavalimani = async (req, res) => {
  try {
    const havalimani = await Havalimani.findById(req.params.id);
    if (!havalimani) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Havalimanı başarıyla getirildi",
      data: havalimani
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Yeni havalimanı ekle
exports.createHavalimani = async (req, res) => {
  try {
    const { adi, il_kodu, ilce_kodu } = req.body;

    const newRecord = await Havalimani.create({
      adi,
      il_kodu,
      ilce_kodu
    });

    return res.status(201).json({
      message: "Havalimanı başarıyla oluşturuldu",
      data: newRecord
    });
  } catch (err) {
    return res.status(400).json({
      message: "Kayıt hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Havalimanı güncelle
exports.updateHavalimani = async (req, res) => {
  try {
    const { adi, sehir } = req.body;
    const updated = await Havalimani.findByIdAndUpdate(
      req.params.id,
      { adi, sehir },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Havalimanı başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Havalimanı sil
exports.deleteHavalimani = async (req, res) => {
  try {
    const deleted = await Havalimani.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Havalimanı başarıyla silindi",
      data: deleted
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm kayıtları sil
exports.deleteAllHavalimanlari = async (req, res) => {
  try {
    const result = await Havalimani.deleteMany({});
    return res.json({
      message: "Tüm havalimanları silindi",
      data: { deletedCount: result.deletedCount }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Toplu silme hatası",
      data: { error: err.message }
    });
  }
};
