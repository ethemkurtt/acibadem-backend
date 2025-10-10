const XLSX = require("xlsx");
const path = require("path");
const Ulke = require("../models/ulke.model");

// 🟢 Excel'den ülkeleri içe aktarma
exports.importUlkeler = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Bölge Ülke Listesi"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const ulkeSet = new Set();

    rows.forEach(row => {
      const hamVeri = row["ÜLKE"];
      if (hamVeri) {
        const ulkeler = hamVeri.split(",").map(u => u.trim());
        ulkeler.forEach(u => {
          if (u) ulkeSet.add(u);
        });
      }
    });

    const tekilUlkeler = Array.from(ulkeSet).map(ad => ({ ad }));

    const inserted = await Ulke.insertMany(tekilUlkeler, { ordered: false });

    return res.json({
      message: "Ülkeler başarıyla yüklendi",
      data: { count: inserted.length }
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Bazı ülkeler zaten kayıtlı",
        data: { error: err.message }
      });
    }
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm ülkeleri getir
exports.getAllUlkeler = async (req, res) => {
  try {
    const ulkeler = await Ulke.find().sort({ ad: 1 });
    return res.json({
      message: "Ülkeler başarıyla getirildi",
      data: ulkeler
    });
  } catch (err) {
    return res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm ülkeleri sil
exports.deleteAllUlkeler = async (req, res) => {
  try {
    const result = await Ulke.deleteMany({});
    return res.json({
      message: "Tüm ülkeler silindi",
      data: { deletedCount: result.deletedCount }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Toplu silme hatası",
      data: { error: err.message }
    });
  }
};
