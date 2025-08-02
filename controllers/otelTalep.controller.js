const OtelTalep = require("../models/otelTalep.model");

// 📌 Tüm Talepler
exports.getAll = async (req, res) => {
  try {
    const talepler = await OtelTalep.find()
      .populate("otelId", "otelAdi")
      .populate("odaTipi", "kategori");
    res.json(talepler);
  } catch (err) {
    res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

// 📌 Tek Talep
exports.getById = async (req, res) => {
  try {
    const talep = await OtelTalep.findById(req.params.id)
      .populate("otelId", "otelAdi")
      .populate("odaTipi", "kategori");
    if (!talep) return res.status(404).json({ error: "Talep bulunamadı" });
    res.json(talep);
  } catch (err) {
    res.status(500).json({ error: "Detay hatası", details: err.message });
  }
};

// 📌 Yeni Talep Oluştur
exports.create = async (req, res) => {
  try {
    const newTalep = await OtelTalep.create(req.body);
    res.status(201).json(newTalep);
  } catch (err) {
    res.status(400).json({ error: "Oluşturma hatası", details: err.message });
  }
};

// 📌 Güncelle
exports.update = async (req, res) => {
  try {
    const updated = await OtelTalep.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Talep bulunamadı" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Güncelleme hatası", details: err.message });
  }
};

// 📌 Sil
exports.remove = async (req, res) => {
  try {
    const deleted = await OtelTalep.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Talep bulunamadı" });
    res.json({ message: "Talep silindi" });
  } catch (err) {
    res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};
