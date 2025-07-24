const XLSX = require("xlsx");
const path = require("path");
const Havalimani = require("../models/havalimanı/havalimani.model");

// 🟢 Excel dosyasından toplu veri yükleme
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
    res.json({
      message: "Havalimanları başarıyla yüklendi",
      count: inserted.length,
    });
  } catch (err) {
    res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
  }
};

// 🟢 Tüm havalimanlarını getir
exports.getAllHavalimanlari = async (req, res) => {
  try {
    const data = await Havalimani.find().sort({ adi: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Listeleme hatası", error: err.message });
  }
};

// 🟢 Tek havalimanı getir
exports.getOneHavalimani = async (req, res) => {
  try {
    const data = await Havalimani.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Kayıt bulunamadı" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Getirme hatası", error: err.message });
  }
};

// 🟢 Yeni havalimanı ekle
exports.createHavalimani = async (req, res) => {
  try {
    const { adi, sehir } = req.body;
    const newRecord = await Havalimani.create({ adi, sehir });
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ message: "Kayıt hatası", error: err.message });
  }
};

// 🟢 Havalimanı güncelle
exports.updateHavalimani = async (req, res) => {
  try {
    const { adi, sehir } = req.body;
    const updated = await Havalimani.findByIdAndUpdate(
      req.params.id,
      { adi, sehir },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Güncellenecek kayıt bulunamadı" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Güncelleme hatası", error: err.message });
  }
};

// 🟢 Havalimanı sil
exports.deleteHavalimani = async (req, res) => {
  try {
    const deleted = await Havalimani.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Silinecek kayıt bulunamadı" });

    res.json({ message: "Havalimanı silindi", id: deleted._id });
  } catch (err) {
    res.status(500).json({ message: "Silme hatası", error: err.message });
  }
};

// 🟢 Tüm kayıtları sil
exports.deleteAllHavalimanlari = async (req, res) => {
  try {
    const result = await Havalimani.deleteMany({});
    res.json({
      message: "Tüm havalimanları silindi",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Toplu silme hatası", error: err.message });
  }
};
