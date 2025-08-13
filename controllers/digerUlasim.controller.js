const DigerUlasimTalep = require('../models/DigerUlasimTalep');

const ALLOWED_TYPES = new Set(['personel','hasta','misafir']);

function sanitizePayload(body) {
  const data = { ...body };
  delete data._token; // Laravel CSRF

  // Tarih: YYYY-MM-DD geldiyse Date'e çevir
  if (data.sefer_tarihi) {
    const dt = new Date(data.sefer_tarihi);
    if (!isNaN(dt.getTime())) data.sefer_tarihi = dt;
  } else {
    data.sefer_tarihi = undefined;
  }

  // type gelmezse personel'e düş
  if (!ALLOWED_TYPES.has(data.type)) {
    data.type = 'personel';
  }

  // talep_tipi gelmezse OTB
  if (!data.talep_tipi) data.talep_tipi = 'OTB';

  return data;
}

// POST /api/seyahat/diger-ulasim-talepler
exports.createTalep = async (req, res) => {
  try {
    const data = sanitizePayload(req.body);
    const doc = await DigerUlasimTalep.create(data);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Oluşturulamadı' });
  }
};

// GET /api/seyahat/diger-ulasim-talepler
exports.listTalepler = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DigerUlasimTalep.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      DigerUlasimTalep.countDocuments(),
    ]);

    res.json({ page, limit, total, pages: Math.ceil(total/limit), items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Listeleme hatası' });
  }
};

// GET /api/seyahat/diger-ulasim-talepler/:id
exports.getTalep = async (req, res) => {
  try {
    const doc = await DigerUlasimTalep.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};

// PUT /api/seyahat/diger-ulasim-talepler/:id
exports.updateTalep = async (req, res) => {
  try {
    const data = sanitizePayload(req.body);
    const doc = await DigerUlasimTalep.findByIdAndUpdate(req.params.id, data, {
      new: true, runValidators: true, overwrite: true
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// PATCH /api/seyahat/diger-ulasim-talepler/:id
exports.patchTalep = async (req, res) => {
  try {
    const data = sanitizePayload(req.body);
    const doc = await DigerUlasimTalep.findByIdAndUpdate(req.params.id, data, {
      new: true, runValidators: true
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// DELETE /api/seyahat/diger-ulasim-talepler/:id
exports.deleteTalep = async (req, res) => {
  try {
    const doc = await DigerUlasimTalep.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json({ ok: true, id: doc._id });
  } catch {
    res.status(400).json({ error: 'Geçersiz id' });
  }
};
