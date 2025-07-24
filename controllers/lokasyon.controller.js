const XLSX = require("xlsx");
const path = require("path");
const Lokasyon = require("../models/lokasyon.model");

exports.importLokasyonlar = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Tüm lokasyonları çek ve tekrarsız hale getir
    const lokasyonSet = new Set();
    rows.forEach(row => {
      if (row["LOKASYON"]) {
        lokasyonSet.add(row["LOKASYON"].trim());
      }
    });

    const lokasyonArray = Array.from(lokasyonSet).map(ad => ({ ad }));
    const result = await Lokasyon.insertMany(lokasyonArray, { ordered: false });

    res.json({ message: "Lokasyonlar başarıyla yüklendi", count: result.length });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: "Bazı lokasyonlar zaten kayıtlı", error: err.message });
    } else {
      res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
    }
  }
};

exports.getAllLokasyonlar = async (req, res) => {
  const data = await Lokasyon.find().sort({ ad: 1 });
  res.json(data);
};

exports.deleteAllLokasyonlar = async (req, res) => {
  const result = await Lokasyon.deleteMany({});
  res.json({ message: "Tüm lokasyonlar silindi", deletedCount: result.deletedCount });
};
