const XLSX = require("xlsx");
const path = require("path");
const Hastane = require("../models/hastane/hastane.model");

exports.importHastaneler = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["HASTANE ADRESLERİ"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const mapped = rows.map(row => ({
      lokasyon: row["LOKASYON"],
      adres: row["ADRES"]
    }));

    const inserted = await Hastane.insertMany(mapped);
    res.json({ message: "Hastane verileri başarıyla yüklendi", count: inserted.length });
  } catch (err) {
    res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
  }
};

exports.getAllHastaneler = async (req, res) => {
  const data = await Hastane.find().sort({ lokasyon: 1 });
  res.json(data);
};

exports.deleteAllHastaneler = async (req, res) => {
  const result = await Hastane.deleteMany({});
  res.json({ message: "Tüm hastane kayıtları silindi", deletedCount: result.deletedCount });
};

exports.createHastene = async (req, res) => {
  try {
    const hastane = await Hastane.create(req.body);
    res.status(201).json(hastane);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.deleteHastene = async (req, res) => {
  const deleted = await Hastane.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Silme başarısız" });
  res.json({ message: "Hastane silindi" });
};
