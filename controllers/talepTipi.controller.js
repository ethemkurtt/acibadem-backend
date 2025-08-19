const TalepTipi = require('../models/talepTipi.model');

// --- TALep TİPİ EKLE ---
// POST /api/talep-tipleri
exports.createTalepTipi = async (req, res) => {
  try {
    const { name, description, active } = req.body || {};
    if (!name?.trim()) {
      return res.status(400).json({ ok: false, message: 'name zorunlu' });
    }
    const doc = await TalepTipi.create({
      name: name.trim(),
      description: description || '',
      active: active !== undefined ? !!active : true,
    });
    return res.status(201).json({ ok: true, data: doc });
  } catch (e) {
    if (e.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, message: 'Aynı isimde talep tipi mevcut (case-insensitive)' });
    }
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

// --- TALep TİPİ DETAY (opsiyonel) ---
// GET /api/talep-tipleri/:id
exports.getTalepTipi = async (req, res) => {
  try {
    const item = await TalepTipi.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });
    return res.json({ ok: true, data: item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};

// --- ALT TÜR EKLE ---
// POST /api/talep-tipleri/:id/alt-turler
exports.addAltTur = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name?.trim()) {
      return res.status(400).json({ ok: false, message: 'Alt tür name zorunlu' });
    }

    const parent = await TalepTipi.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ ok: false, message: 'Talep tipi bulunamadı' });
    }

    const name_lc = name.toLowerCase();
    const conflict = parent.altTurler.some((a) => a.name_lc === name_lc);
    if (conflict) {
      return res
        .status(409)
        .json({ ok: false, message: 'Bu talep tipinde aynı isimde alt tür zaten var' });
    }

    parent.altTurler.push({ name, name_lc });
    await parent.save();

    // Son eklenen alt türü bulalım
    const altTur = parent.altTurler[parent.altTurler.length - 1];
    return res.status(201).json({
      ok: true,
      data: {
        parentId: parent._id,
        altTur,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Sunucu hatası' });
  }
};
