const XLSX = require("xlsx");
const path = require("path");
const Ulke = require("../models/ulke.model");

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
    res.json({ message: "Ülkeler başarıyla yüklendi", count: inserted.length });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: "Bazı ülkeler zaten kayıtlı", error: err.message });
    } else {
      res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
    }
  }
};

exports.getAllUlkeler = async (req, res) => {
  const data = await Ulke.find().sort({ ad: 1 });
  res.json(data);
};

exports.deleteAllUlkeler = async (req, res) => {
  const result = await Ulke.deleteMany({});
  res.json({ message: "Tüm ülkeler silindi", deletedCount: result.deletedCount });
};
