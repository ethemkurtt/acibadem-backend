const UcakTalep = require('../models/UcakTalep');

// Create
exports.createTalep = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._token; // Laravel CSRF token'ı DB'ye kaydetme
    const talep = await UcakTalep.create(data);
    res.status(201).json(talep);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// List
exports.getTalepler = async (req, res) => {
  try {
    const talepler = await UcakTalep.find().sort({ createdAt: -1 });
    res.json(talepler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get by ID
exports.getTalep = async (req, res) => {
  try {
    const talep = await UcakTalep.findById(req.params.id);
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı' });
    res.json(talep);
  } catch (err) {
    res.status(400).json({ error: 'Geçersiz ID' });
  }
};

// Update (PUT)
exports.updateTalep = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data._token;
    const talep = await UcakTalep.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı' });
    res.json(talep);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteTalep = async (req, res) => {
  try {
    const talep = await UcakTalep.findByIdAndDelete(req.params.id);
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Geçersiz ID' });
  }
};
