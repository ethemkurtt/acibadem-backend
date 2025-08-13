// controllers/ticketRequest.controller.js
const TicketRequest = require('../models/TicketRequest');

// Yardımcı: istek gövdesini temizle (_token at)
function pickAllowed(body) {
  const {
    yolcu_sayisi,
    yon,
    nereden,
    nereye,
    ucus_tarihi,
    ucus_saati,
    havayolu,
    ucus_kodu,
    bilet_sinifi,
    ekstra_bagaj,
    bilet_opsiyon,
    opsiyon_tarihi,
    donus_tarihi,
    donus_saati,
    donus_havayolu,
    donus_ucus_kodu,
    aciklama,
  } = body;

  return {
    yolcu_sayisi,
    yon,
    nereden,
    nereye,
    ucus_tarihi,
    ucus_saati,
    havayolu,
    ucus_kodu,
    bilet_sinifi,
    ekstra_bagaj,
    bilet_opsiyon,
    opsiyon_tarihi,
    donus_tarihi,
    donus_saati,
    donus_havayolu,
    donus_ucus_kodu,
    aciklama,
  };
}

// POST /api/talepler
exports.createTicket = async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const doc = await TicketRequest.create(data);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Oluşturulamadı' });
  }
};

// GET /api/talepler  (liste + basit sayfalama)
exports.listTickets = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TicketRequest.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      TicketRequest.countDocuments(),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Listeleme hatası' });
  }
};

// GET /api/talepler/:id
exports.getTicket = async (req, res) => {
  try {
    const doc = await TicketRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: 'Geçersiz id' });
  }
};

// PUT /api/talepler/:id (tam güncelleme)
exports.updateTicket = async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const doc = await TicketRequest.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// PATCH /api/talepler/:id (kısmi güncelleme)
exports.patchTicket = async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const doc = await TicketRequest.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Güncelleme hatası' });
  }
};

// DELETE /api/talepler/:id
exports.deleteTicket = async (req, res) => {
  try {
    const doc = await TicketRequest.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    return res.json({ ok: true, id: doc._id });
  } catch (err) {
    return res.status(400).json({ error: 'Geçersiz id' });
  }
};
