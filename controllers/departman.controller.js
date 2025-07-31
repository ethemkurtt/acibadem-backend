const XLSX = require("xlsx");
const path = require("path");
const Departman = require("../models/departman.model");

exports.importDepartmanlar = async (req, res) => {
  try {
     const filePath = path.join(
          __dirname,
          "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx"
        );
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Departman Listesi"];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const departmanSet = new Set();
    rows.slice(1).forEach((row) => {
      const value = row[0];
      if (value) departmanSet.add(value.trim());
    });

    const departmanArray = Array.from(departmanSet).map((ad) => ({ ad }));

    const result = await Departman.insertMany(departmanArray, { ordered: false });

    res.json({
      message: "Departmanlar başarıyla yüklendi",
      count: result.length,
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({
        message: "Bazı departmanlar zaten kayıtlı",
        error: err.message,
      });
    } else {
      res
        .status(500)
        .json({ message: "İçe aktarma hatası", error: err.message });
    }
  }
};

exports.getAllDepartmanlar = async (req, res) => {
  const data = await Departman.find().sort({ ad: 1 });
  res.json(data);
};

exports.getDepartmanById = async (req, res) => {
  try {
    const departman = await Departman.findById(req.params.id);
    if (!departman) return res.status(404).json({ message: "Departman bulunamadı" });
    res.json(departman);
  } catch (err) {
    res.status(500).json({ message: "Hata", error: err.message });
  }
};

exports.deleteAllDepartmanlar = async (req, res) => {
  const result = await Departman.deleteMany({});
  res.json({
    message: "Tüm departmanlar silindi",
    deletedCount: result.deletedCount,
  });
};

exports.createDepartman = async (req, res) => {
  try {
    const departman = await Departman.create({ ad: req.body.ad });
    res.json(departman);
  } catch (err) {
    res.status(500).json({ message: "Departman ekleme hatası", error: err.message });
  }
};

exports.updateDepartman = async (req, res) => {
  try {
    const departman = await Departman.findByIdAndUpdate(
      req.params.id,
      { ad: req.body.ad },
      { new: true }
    );
    res.json(departman);
  } catch (err) {
    res.status(500).json({ message: "Departman güncelleme hatası", error: err.message });
  }
};

exports.deleteDepartman = async (req, res) => {
  try {
    await Departman.findByIdAndDelete(req.params.id);
    res.json({ message: "Departman silindi" });
  } catch (err) {
    res.status(500).json({ message: "Departman silme hatası", error: err.message });
  }
};
