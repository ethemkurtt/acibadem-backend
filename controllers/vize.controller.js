const VizeTalep = require('../models/VizeTalep');

const ALLOWED_TYPES = new Set(['personel','hasta','misafir']);

function sanitize(body) {
  const data = { ...body };
  delete data._token;

  if (!ALLOWED_TYPES.has(data.type)) data.type = 'personel';
  if (!Array.isArray(data.evrak_adlari)) data.evrak_adlari = data.evrak_adlari ? [String(data.evrak_adlari)] : [];

  return data;
}

exports.createTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await VizeTalep.create(data);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Oluşturulamadı' });
  }
};

exports.listTalepler = async (req, res) => {
  try {
    const list = await VizeTalep.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Listeleme hatası' });
  }
};

exports.getTalep = async (req, res) => {
  try {
    const doc = await VizeTalep.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};

exports.updateTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await VizeTalep.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true, overwrite: true });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

exports.patchTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await VizeTalep.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

exports.deleteTalep = async (req, res) => {
  try {
    const doc = await VizeTalep.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json({ ok: true, id: doc._id });
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};
