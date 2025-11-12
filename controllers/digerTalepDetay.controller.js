
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const DigerDetay = require("../models/talepler/digerTalepDetay.model");

// ⚡ Optimizasyon araçları
const taleplerOptimizer = require("../utils/taleplerOptimizer");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const toNullIfEmpty = (v) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const pick = (obj, keys) =>
  (keys || []).reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});

// "YYYY-MM-DD" + "HH:mm" -> Date (yerel saatle)
function toDateFromParts(dateStr, timeStr) {
  if (!dateStr) return null;
  const [hh = "0", mm = "0"] = (timeStr || "00:00").split(":");
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
  return d;
}

// Hata/dup yardımcıları
const isDup = (err) => err && (err.code === 11000 || err.code === 11001);

// ---- Populate şemaları (personel ile aynı yaklaşım) ----
const TALEP_POPULATE = [
  { path: "lokasyon" },
  { path: "arac" },
  { path: "sofor", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "talepEdenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "atamaYapanId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "lokasyonSonDegistirenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
];

// DigerDetay için ekstra populate yok ama ileride gerekirse eklenebilir
const DETAY_POPULATE = [];

// ---- Alan listeleri ----
const DETAY_FIELDS = [
  "talep_tipi",
  "talep_tipi_diger",
  "alt_tip",
  "alt_tip_diger",
  "talep_aciklama",
  "nereden",
  "nereye",
  "transferTarihi",
  // Not: Şema transferTarihi içeriyor; iş kuralı gereği Talepler'de tutuluyor.
  // Gerekirse açmak için aşağıyı yorumdan çıkarın:
  // "transferTarihi",
];

const TALEP_FIELDS = [
  "fullName",
  "passportNo",
  "phone",
  "lokasyon",
  "kategori",
  "arac",
  "sofor",
  "atamaDurumu",
  "transferTarihi",
  "transferSaati",
  "talepDurumu",
  "talepEdenId",
  "isDurumu",
  "atamaYapanId",
  "atamaYapanAdSoyad",
  "uetdsSeferReferansNo",
  "lokasyonSonDegistirenId",
  "description",
  "talepEdenAdSoyad", // personel controller ile paralellik için eklendi (opsiyonel)
];

/** 1) Tek başına DigerDetay oluştur (opsiyonel talep_id) */
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const { talep_id } = body;

    if (talep_id && !isId(talep_id)) {
      return res.status(400).json({
        message: "Geçersiz talep_id",
        data: { error: "Invalid talep_id format." },
      });
    }

    const raw = pick(body, DETAY_FIELDS);
    // boş string -> null
    const sanitized = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, toNullIfEmpty(v)])
    );

    const payload = { ...sanitized, talep_id: talep_id || null };

    const doc = await DigerDetay.create(payload);
    const populatedDetay = await DigerDetay.findById(doc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Diğer detay başarıyla oluşturuldu",
      data: { talep: null, detay: populatedDetay },
    });
  } catch (err) {
    if (isDup(err)) {
      return res.status(409).json({
        message: "Bu talep için detay zaten mevcut (unique talep_id)",
        data: { error: "Duplicate key on talep_id." },
      });
    }
    return res.status(400).json({
      message: "Diğer detay oluşturulamadı",
      data: { error: err.message },
    });
  }
};

/** 2) Birleştirilmiş oluşturma: Talepler + DigerDetay (flat veya nested gövde) */
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Talepler ortak alanlar
    const talepPayload = pick(srcTalep, TALEP_FIELDS);
    talepPayload.requestType = "diger";

    // Eski alan adları ile gelmişse map'le
    const legacyDate = srcDetay.transfer_tarih || srcTalep.transfer_tarih;
    const legacyTime = srcDetay.transfer_saat || srcTalep.transfer_saat;
    if (!talepPayload.transferTarihi && (legacyDate || legacyTime)) {
      const dt = toDateFromParts(legacyDate, legacyTime);
      if (dt) talepPayload.transferTarihi = dt;
      if (legacyTime) talepPayload.transferSaati = legacyTime;
    }

    // Talepler'ı oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // DigerDetay'ı oluştur (boş string -> null)
    const rawDetay = pick(srcDetay, DETAY_FIELDS);
    const sanitizedDetay = Object.fromEntries(
      Object.entries(rawDetay).map(([k, v]) => [k, toNullIfEmpty(v)])
    );

    const [detayDoc] = await DigerDetay.create(
      [{ ...sanitizedDetay, talep_id: talepDoc._id }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate edilmiş ver
    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await DigerDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Diğer talep ve detay başarıyla oluşturuldu",
      data: { talep: populatedTalep, detay: populatedDetay },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    if (isDup(err)) {
      return res.status(409).json({
        message: "Bu talep için detay zaten mevcut (unique talep_id)",
        data: { error: "Duplicate key on talep_id." },
      });
    }
    return res.status(400).json({
      message: "Birleştirilmiş oluşturma başarısız",
      data: { error: err.message },
    });
  }
};

/** 3) talep_id ile GET (talep + detay birlikte döner) */
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) {
      return res.status(400).json({
        message: "Geçersiz talepId",
        data: { error: "Invalid talepId format." },
      });
    }

    const talep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    if (!talep) {
      return res.status(404).json({
        message: "Talep bulunamadı",
        data: { talep: null, detay: null },
      });
    }

    const detay = await DigerDetay.findOne({ talep_id: talepId })
      .populate(DETAY_POPULATE)
      .lean();

    if (!detay) {
      return res.status(404).json({
        message: "Diğer detayı bulunamadı",
        data: { talep, detay: null },
      });
    }

    return res.json({
      message: "Kayıt getirildi",
      data: { talep, detay },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message },
    });
  }
};

/** 4) talep_id ile GÜNCELLE (Talepler + DigerDetay kısmi güncelleme) */
exports.updateByTalepId = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Geçersiz talepId",
        data: { error: "Invalid talepId format." },
      });
    }

    const body = req.body || {};

    // --- Talepler kısmı (opsiyonel) ---
    const srcTalep = body.talep || {};
    const talepSet = pick(srcTalep, TALEP_FIELDS);

    // Eski alan adları ile güncelleme gelmişse:
    const legacyDate = body.transfer_tarih || srcTalep.transfer_tarih;
    const legacyTime = body.transfer_saat || srcTalep.transfer_saat;
    if (!talepSet.transferTarihi && (legacyDate || legacyTime)) {
      const dt = toDateFromParts(legacyDate, legacyTime);
      if (dt) talepSet.transferTarihi = dt;
      if (legacyTime) talepSet.transferSaati = legacyTime;
    }

    let updatedTalep = null;
    if (Object.keys(talepSet).length) {
      talepSet.requestType = "diger"; // tipi güvene al
      updatedTalep = await Talepler.findByIdAndUpdate(
        talepId,
        { $set: talepSet },
        { new: true, runValidators: true, session }
      );
      if (!updatedTalep) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        return res.status(404).json({
          message: "Talep bulunamadı",
          data: { talep: null, detay: null },
        });
      }
    }

    // --- DigerDetay kısmı (opsiyonel) ---
    const srcDetay = body.detay || body; // düz veya nested destekle
    const raw = pick(srcDetay, DETAY_FIELDS);
    const entries = Object.entries(raw).filter(([, v]) => v !== undefined);
    let updatedDetayDoc = null;

    if (entries.length) {
      const setPayload = Object.fromEntries(
        entries.map(([k, v]) => [k, toNullIfEmpty(v)])
      );

      updatedDetayDoc = await DigerDetay.findOneAndUpdate(
        { talep_id: talepId },
        { $set: setPayload },
        { new: true, runValidators: true, upsert: false, session }
      );

      if (!updatedDetayDoc) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        return res.status(404).json({
          message: "Diğer detayı bulunamadı",
          data: { talep: null, detay: null },
        });
      }
    }

    // Hiçbir alan gönderilmemişse 400
    if (!Object.keys(talepSet).length && !entries.length) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Güncellenecek alan yok",
        data: { error: "No valid fields in request body." },
      });
    }

    await session.commitTransaction();
    session.endSession();

    // Populates
    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await DigerDetay.findOne({ talep_id: talepId })
      .populate(DETAY_POPULATE)
      .lean();

    return res.json({
      message: "Diğer detayı başarıyla güncellendi",
      data: { talep: populatedTalep, detay: populatedDetay },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message },
    });
  }
};

/** 5) talep_id ile sil (yalnızca detay kaydı) */
exports.deleteByTalepId = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Geçersiz talepId",
        data: { error: "Invalid talepId format." },
      });
    }

    const deleted = await DigerDetay.findOneAndDelete(
      { talep_id: talepId },
      { session }
    );

    if (!deleted) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(404).json({
        message: "Kayıt bulunamadı",
        data: { talep: null, detay: null },
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Diğer detayı silindi",
      data: { talep: null, detay: null },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message },
    });
  }
};

/** 6) Detay _id ile getir (opsiyonel yardımcı) */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) {
      return res.status(400).json({
        message: "Geçersiz id",
        data: { error: "Invalid id format." },
      });
    }
    const doc = await DigerDetay.findById(id)
      .populate(DETAY_POPULATE)
      .lean();
    if (!doc) {
      return res.status(404).json({
        message: "Kayıt bulunamadı",
        data: { detay: null },
      });
    }
    return res.json({
      message: "Kayıt getirildi",
      data: { detay: doc },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message },
    });
  }
};

/** 7) Listeleme + filtre + sayfalama
 *  GET /diger-detay?talep_tipi=Evrak&alt_tip=Banka&page=1&pageSize=20&search=...&from=2025-01-01&to=2025-12-31
 */
exports.list = async (req, res) => {
  try {
    const { talep_tipi, alt_tip, search, from, to, page = 1, pageSize = 20 } =
      req.query || {};

    const q = {};
    if (talep_tipi) q.talep_tipi = talep_tipi;
    if (alt_tip) q.alt_tip = alt_tip;

    if (search) {
      const re = new RegExp(search, "i");
      q.$or = [{ talep_aciklama: re }, { nereden: re }, { nereye: re }];
    }

    const createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) createdAt.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) createdAt.$lte = d;
    }
    if (Object.keys(createdAt).length) q.createdAt = createdAt;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * limit;

    const [items, total] = await Promise.all([
      DigerDetay.find(q)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DigerDetay.countDocuments(q),
    ]);

    return res.json({
      message: "Liste getirildi",
      data: {
        items,
        total,
        page: Math.floor(skip / limit) + 1,
        pageSize: limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message },
    });
  }
};
