const DigerTalep = require('../models/DigerTalep');

// POST - Yeni talep oluştur
exports.create = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._token; // Laravel CSRF token'i sil

    const doc = await DigerTalep.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Oluşturma hatası' });
  }
};

// GET - Listeleme
exports.list = async (req, res) => {
  try {
    const docs = await DigerTalep.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Listeleme hatası' });
  }
};

// GET - Tek kayıt
exports.getById = async (req, res) => {
  try {
    const doc = await DigerTalep.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'Geçersiz ID' });
  }
};

// PATCH - Güncelleme
exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload._token;

    const doc = await DigerTalep.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!doc) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// DELETE - Silme
exports.remove = async (req, res) => {
  try {
    const doc = await DigerTalep.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Bulunamadı' });
    res.json({ ok: true, id: doc._id });
  } catch {
    res.status(400).json({ error: 'Geçersiz ID' });
  }
};
