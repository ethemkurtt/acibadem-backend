const DigerTalep = require("../models/digerTalep.model");

/** Helper: gelen body’deki "" değerlerini null yap */
const normalizeBody = (obj = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.trim() === "") out[k] = null;
    else out[k] = v;
  }
  return out;
};

/** POST /api/diger-talep */
exports.createDigerTalep = async (req, res) => {
  try {
    const payload = normalizeBody({ ...req.body });
    delete payload._token; // Laravel formlarından gelebilir
    const doc = await DigerTalep.create(payload);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/** GET /api/diger-talep?search=&page=1&limit=25&sort=-createdAt */
exports.getAllDigerTalepler = async (req, res) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "25",
      sort = "-createdAt",
    } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);

    const q = {};
    if (search) {
      const rx = new RegExp(String(search), "i");
      q.$or = [
        { talep_tipi: rx },
        { alt_tip: rx },
        { talep_aciklama: rx },
        { nereden: rx },
        { nereye: rx },
      ];
    }

    const sortSpec = {};
    if (String(sort).startsWith("-")) sortSpec[String(sort).slice(1)] = -1;
    else sortSpec[String(sort)] = 1;

    const total = await DigerTalep.countDocuments(q);
    const items = await DigerTalep.find(q)
      .sort(sortSpec)
      .skip((p - 1) * l)
      .limit(l)
      .lean();

    return res.json({
      data: items,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/** GET /api/diger-talep/:id */
exports.getDigerTalepById = async (req, res) => {
  try {
    const doc = await DigerTalep.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: "Geçersiz ID" });
  }
};

/** PUT /api/diger-talep/:id (tam/kısmi update) */
exports.updateDigerTalep = async (req, res) => {
  try {
    const payload = normalizeBody({ ...req.body });
    delete payload._token;

    const doc = await DigerTalep.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/** DELETE /api/diger-talep/:id */
exports.deleteDigerTalep = async (req, res) => {
  try {
    const r = await DigerTalep.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.json({ message: "Silindi" });
  } catch (err) {
    return res.status(400).json({ message: "Geçersiz ID" });
  }
};

/** (Opsiyonel) DELETE /api/diger-talep  -> tümünü siler */
exports.deleteAllDigerTalepler = async (_req, res) => {
  const r = await DigerTalep.deleteMany({});
  return res.json({ message: "Tüm kayıtlar silindi", deleted: r.deletedCount });
};
