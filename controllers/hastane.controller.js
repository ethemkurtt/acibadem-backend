const XLSX = require("xlsx");
const path = require("path");
const Hastane = require("../models/hastane/hastane.model");

// HASTANELERİ İÇE AKTAR
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

    res.json({
      message: "Hastane verileri başarıyla yüklendi",
      data: { count: inserted.length }
    });
  } catch (err) {
    res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

// TÜM HASTANELERİ GETİR
exports.getAllHastaneler = async (req, res) => {
  try {
    const hastaneler = await Hastane.find().sort({ lokasyon: 1 });
    res.json({
      message: "Tüm hastaneler başarıyla getirildi",
      data: hastaneler
    });
  } catch (err) {
    res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

// TÜM HASTANELERİ SİL
exports.deleteAllHastaneler = async (req, res) => {
  try {
    const result = await Hastane.deleteMany({});
    res.json({
      message: "Tüm hastane kayıtları silindi",
      data: { deletedCount: result.deletedCount }
    });
  } catch (err) {
    res.status(500).json({
      message: "Silme işlemi başarısız",
      data: { error: err.message }
    });
  }
};

// HASTANE OLUŞTUR
exports.createHastene = async (req, res) => {
  try {
    const hastane = await Hastane.create(req.body);
    res.status(201).json({
      message: "Hastane başarıyla oluşturuldu",
      data: hastane
    });
  } catch (err) {
    res.status(400).json({
      message: "Oluşturma hatası",
      data: { error: err.message }
    });
  }
};

// HASTANE SİL
exports.deleteHastene = async (req, res) => {
  try {
    const deleted = await Hastane.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Silme başarısız",
        data: null
      });
    }
    res.json({
      message: "Hastane başarıyla silindi",
      data: deleted
    });
  } catch (err) {
    res.status(400).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};

// HASTANE GÜNCELLE
exports.updateHastane = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Hastane.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({
        message: "Hastane bulunamadı",
        data: null
      });
    }

    res.json({
      message: "Hastane başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

// ID İLE HASTANE GETİR
exports.getHastaneById = async (req, res) => {
  try {
    const hastane = await Hastane.findById(req.params.id);
    if (!hastane) {
      return res.status(404).json({
        message: "Hastane bulunamadı",
        data: null
      });
    }

    res.json({
      message: "Hastane başarıyla getirildi",
      data: hastane
    });
  } catch (err) {
    res.status(400).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};
