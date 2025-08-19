// controllers/talepTipi.controller.js
const TalepTipi = require('../models/talepTipi.model');

/**
 * GET /api/talep-tipleri
 * q: arama (tip adı veya alt tür adı)
 * active: true|false (opsiyonel)
 */
exports.listTalepTipleri = async (req, res) => {
  try {
    const { q, active } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'altTurler.name': { $regex: q, $options: 'i' } }
      ];
    }

    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;

    const items = await TalepTipi.find(filter)
      .sort({ name: 1 })
      .lean();

    return res.json({ ok: true, data: items });
  } catch (e) {
    console.error('listTalepTipleri error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/talep-tipleri/:id
 */
exports.getTalepTipi = async (req, res) => {
  try {
    const item = await TalepTipi.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });
    return res.json({ ok: true, data: item });
  } catch (e) {
    console.error('getTalepTipi error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * POST /api/talep-tipleri
 * body: { name, description?, active? }
 */
exports.createTalepTipi = async (req, res) => {
  try {
    const { name, description, active } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, message: 'name zorunlu' });
    }

    const doc = await TalepTipi.create({
      name: String(name).trim(),
      description: description || '',
      active: typeof active === 'boolean' ? active : true
      // name_lc model hook ile set ediliyor
    });

    return res.status(201).json({ ok: true, data: doc });
  } catch (e) {
    if (e?.code === 11000) {
      // unique index çakışması (name/name_lc)
      return res.status(409).json({ ok: false, message: 'Aynı isimde talep tipi mevcut' });
    }
    console.error('createTalepTipi error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * PATCH /api/talep-tipleri/:id
 * body: { name?, description?, active? }
 */
exports.updateTalepTipi = async (req, res) => {
  try {
    const payload = {};
    if (typeof req.body.name === 'string') {
      payload.name = req.body.name.trim();
      payload.name_lc = payload.name.toLowerCase(); // case-insensitive eşsiz alan
    }
    if (typeof req.body.description === 'string') payload.description = req.body.description;
    if (typeof req.body.active === 'boolean') payload.active = req.body.active;

    const updated = await TalepTipi.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });
    return res.json({ ok: true, data: updated });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, message: 'Aynı isimde talep tipi mevcut' });
    }
    console.error('updateTalepTipi error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * DELETE /api/talep-tipleri/:id
 */
exports.removeTalepTipi = async (req, res) => {
  try {
    const del = await TalepTipi.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('removeTalepTipi error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * POST /api/talep-tipleri/:id/alt-turler
 * body: { name }
 */
exports.addAltTur = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, message: 'Alt tür name zorunlu' });
    }

    const parent = await TalepTipi.findById(req.params.id);
    if (!parent) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });

    const name_lc = String(name).toLowerCase();
    const conflict = parent.altTurler.some((a) => a.name_lc === name_lc);
    if (conflict) {
      return res.status(409).json({ ok: false, message: 'Bu talep tipinde aynı isimde alt tür var' });
    }

    parent.altTurler.push({ name: String(name).trim(), name_lc });
    await parent.save();

    const altTur = parent.altTurler[parent.altTurler.length - 1];
    return res.status(201).json({ ok: true, data: { parentId: parent._id, altTur } });
  } catch (e) {
    console.error('addAltTur error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * PATCH /api/talep-tipleri/:id/alt-turler/:altId
 * body: { name }
 */
exports.updateAltTur = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, message: 'Alt tür name zorunlu' });
    }

    const parent = await TalepTipi.findById(req.params.id);
    if (!parent) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });

    const alt = parent.altTurler.id(req.params.altId);
    if (!alt) return res.status(404).json({ ok: false, message: 'Alt tür bulunamadı' });

    const name_lc = String(name).toLowerCase();
    const conflict = parent.altTurler.some(
      (a) => String(a._id) !== String(alt._id) && a.name_lc === name_lc
    );
    if (conflict) {
      return res.status(409).json({ ok: false, message: 'Bu talep tipinde aynı isimde alt tür var' });
    }

    alt.name = String(name).trim();
    alt.name_lc = name_lc;
    await parent.save();

    return res.json({ ok: true, data: parent });
  } catch (e) {
    console.error('updateAltTur error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

/**
 * DELETE /api/talep-tipleri/:id/alt-turler/:altId
 */
exports.removeAltTur = async (req, res) => {
  try {
    const parent = await TalepTipi.findById(req.params.id);
    if (!parent) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });

    const alt = parent.altTurler.id(req.params.altId);
    if (!alt) return res.status(404).json({ ok: false, message: 'Alt tür bulunamadı' });

    alt.deleteOne(); // alt dokümanı kaldır
    await parent.save();

    return res.json({ ok: true });
  } catch (e) {
    console.error('removeAltTur error:', e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};
