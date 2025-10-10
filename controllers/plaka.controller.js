// controllers/plaka.controller.js
const XLSX = require("xlsx");
const path = require("path");
const Plaka = require("../models/Plaka");

// ---- CRUD ----
exports.create = async (req, res) => {
  try {
    const created = await Plaka.create(req.body);
    return res.status(201).json({
      message: "Plaka başarıyla oluşturuldu",
      data: created
    });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    return res.status(status).json({
      message: "Oluşturma hatası",
      data: { error: err.message }
    });
  }
};

exports.list = async (req, res) => {
  try {
    const { q, status, lokasyonId, id, limit = 200, skip = 0 } = req.query;

    const filter = {};
    if (typeof id !== "undefined" && id !== "") {
      const idNum = Number(id);
      if (!Number.isNaN(idNum)) filter.id = idNum;
    }
    if (typeof status !== "undefined" && status !== "") {
      const val = String(status).toLowerCase();
      filter.status = (val === "true" || val === "1");
    }
    if (lokasyonId) filter.lokasyonId = lokasyonId;
    if (q) {
      const r = { $regex: String(q), $options: "i" };
      filter.$or = [
        { plaka: r }, { bolum: r }, { marka: r }, { tip: r }, { lokasyonAd: r }
      ];
    }

    const items = await Plaka.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    return res.json({
      message: "Plakalar başarıyla getirildi",
      data: items
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message }
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Plaka.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        message: "Plaka bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Plaka başarıyla getirildi",
      data: item
    });
  } catch (err) {
    return res.status(400).json({
      message: "Getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Plaka.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({
        message: "Plaka bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Plaka başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    return res.status(status).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

exports.patch = async (req, res) => {
  try {
    const updated = await Plaka.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({
        message: "Plaka bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Plaka başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    return res.status(status).json({
      message: "Kısmi güncelleme hatası",
      data: { error: err.message }
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Plaka.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Plaka bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Plaka başarıyla silindi",
      data: deleted
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};

// ---- Ekstra ----
exports.getAktifAraclar = async (req, res) => {
  try {
    const araclar = await Plaka.find({ status: true })
      .select("plaka marka tip lokasyonId lokasyonAd");
    return res.json({
      message: "Aktif araçlar başarıyla getirildi",
      data: araclar
    });
  } catch (err) {
    return res.status(500).json({
      message: "Araç listesi alınamadı",
      data: { error: err.message }
    });
  }
};
