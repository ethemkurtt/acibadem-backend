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
      if (value) departmanSet.add(String(value).trim());
    });

    const departmanArray = Array.from(departmanSet).map((ad) => ({ ad }));

    const result = await Departman.insertMany(departmanArray, { ordered: false });

    return res.json({
      message: "Departmanlar başarıyla yüklendi",
      data: { count: result.length }
    });
  } catch (err) {
    // duplicate key hatası
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Bazı departmanlar zaten kayıtlı",
        data: { error: err.message }
      });
    }
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

exports.getAllDepartmanlar = async (req, res) => {
  try {
    const departmanlar = await Departman.find().sort({ ad: 1 });
    return res.json({
      message: "Departmanlar başarıyla getirildi",
      data: departmanlar
    });
  } catch (err) {
    return res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.getDepartmanById = async (req, res) => {
  try {
    const departman = await Departman.findById(req.params.id);
    if (!departman) {
      return res.status(404).json({
        message: "Departman bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Departman başarıyla getirildi",
      data: departman
    });
  } catch (err) {
    return res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.deleteAllDepartmanlar = async (req, res) => {
  try {
    const result = await Departman.deleteMany({});
    return res.json({
      message: "Tüm departmanlar silindi",
      data: { deletedCount: result.deletedCount }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};

exports.createDepartman = async (req, res) => {
  try {
    const departman = await Departman.create({ ad: req.body.ad });
    return res.status(201).json({
      message: "Departman başarıyla oluşturuldu",
      data: departman
    });
  } catch (err) {
    // Duplicate name gibi durumlarda 400 döndür
    return res.status(400).json({
      message: "Departman ekleme hatası",
      data: { error: err.message }
    });
  }
};

exports.updateDepartman = async (req, res) => {
  try {
    const departman = await Departman.findByIdAndUpdate(
      req.params.id,
      { ad: req.body.ad },
      { new: true, runValidators: true }
    );

    if (!departman) {
      return res.status(404).json({
        message: "Departman bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Departman başarıyla güncellendi",
      data: departman
    });
  } catch (err) {
    return res.status(400).json({
      message: "Departman güncelleme hatası",
      data: { error: err.message }
    });
  }
};

exports.deleteDepartman = async (req, res) => {
  try {
    const deleted = await Departman.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Departman bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Departman başarıyla silindi",
      data: deleted
    });
  } catch (err) {
    return res.status(500).json({
      message: "Departman silme hatası",
      data: { error: err.message }
    });
  }
};
