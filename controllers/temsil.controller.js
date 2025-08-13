const TemsilTalep = require('../models/TemsilTalep');

const ALLOWED_TYPES = new Set(['personel','hasta','misafir']);

function sanitize(body){
  const data = { ...body };
  delete data._token;
  // katılımcı sayısı number
  if (data.katilimci_sayisi !== undefined && data.katilimci_sayisi !== null) {
    const n = Number(data.katilimci_sayisi);
    if (!Number.isNaN(n)) data.katilimci_sayisi = n;
  }
  // type gelmezse personel
  if (!ALLOWED_TYPES.has(data.type)) data.type = 'personel';
  return data;
}

// POST /api/seyahat/temsil-talepler
exports.createTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await TemsilTalep.create(data);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Oluşturulamadı' });
  }
};

// GET list
exports.listTalepler = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TemsilTalep.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      TemsilTalep.countDocuments()
    ]);
    res.json({ page, limit, total, pages: Math.ceil(total/limit), items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Listeleme hatası' });
  }
};

// GET by id
exports.getTalep = async (req, res) => {
  try {
    const doc = await TemsilTalep.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};

// PUT (overwrite)
exports.updateTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await TemsilTalep.findByIdAndUpdate(req.params.id, data, {
      new: true, runValidators: true, overwrite: true
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// PATCH (partial)
exports.patchTalep = async (req, res) => {
  try {
    const data = sanitize(req.body);
    const doc = await TemsilTalep.findByIdAndUpdate(req.params.id, data, {
      new: true, runValidators: true
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// DELETE
exports.deleteTalep = async (req, res) => {
  try {
    const doc = await TemsilTalep.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json({ ok: true, id: doc._id });
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};
