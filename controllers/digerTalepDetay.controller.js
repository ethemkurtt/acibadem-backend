// controllers/digerTalepDetay.controller.js (revamped)
// Selibon Medya A.Ş. — Diger Talep Detay Controller
// - Hata yönetimi ve tekrar eden kodlar sadeleştirildi
// - createCombined için transaction akışı güçlendirildi (try/catch/finally)
// - Listeleme + filtreleme + sayfalama eklendi
// - Güncellemede boş string → null dönüşümü ve kısmi $set desteği eklendi
// - 11000 (unique) hataları için anlaşılır dönüşler eklendi

const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const DigerDetay = require("../models/talepler/digerTalepDetay.model");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const pick = (obj, keys) =>
  keys?.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {}) || {};

/** "YYYY-MM-DD" + "HH:mm" → Date (yerel saat) */
function toDateFromParts(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = (timeStr || "00:00").split(":");
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(parseInt(t[0] || "0", 10), parseInt(t[1] || "0", 10), 0, 0);
  return d;
}

// Boş string → null (update payloadlarında da uygulayalım)
const toNullIfEmpty = (v) => (typeof v === "string" && v.trim() === "" ? null : v);

// Tek tip başarılı/başarısız cevap
function ok(res, data, code = 200) {
  return res.status(code).json({ ok: true, data });
}
function fail(res, code, message, error) {
  return res.status(code).json({ ok: false, message, ...(error ? { error } : {}) });
}

// Mongo duplicate key helper
function isDup(err) {
  return err && (err.code === 11000 || err.code === 11001);
}

// Alan listeleri
const DETAY_FIELDS = [
  "talep_tipi",
  "talep_tipi_diger",
  "alt_tip",
  "alt_tip_diger",
  "talep_aciklama",
  "nereden",
  "nereye",
  // Not: Şema transferTarihi içeriyor, ama iş kuralı gereği Talepler tablosunda tutuluyor.
  // Gerekirse açmak için bir sonraki satırı yorumdan çıkarın:
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
];

// 1) Tek başına DigerDetay oluştur (opsiyonel talep_id)
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const { talep_id } = body;

    if (talep_id && !isId(talep_id)) {
      return fail(res, 400, "Geçersiz talep_id");
    }

    // Boş stringleri null'a çevir
    const raw = pick(body, DETAY_FIELDS);
    const sanitized = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, toNullIfEmpty(v)])
    );

    const payload = { ...sanitized, talep_id: talep_id || null };

    const doc = await DigerDetay.create(payload);
    return ok(res, doc, 201);
  } catch (err) {
    if (isDup(err)) {
      return fail(res, 409, "Bu talep için detay zaten mevcut (unique talep_id)");
    }
    return fail(res, 400, "Diğer detay oluşturulamadı", err.message);
  }
};

// 2) Birleştirilmiş oluşturma: Talepler + DigerDetay
// - requestType 'diger' olarak set edilir.
// - Eski alan isimleri (transfer_tarih / transfer_saat) Talepler'e map'lenir.
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;
    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Talepler ortak alanlar (opsiyonel)
    const talepPayload = pick(srcTalep, TALEP_FIELDS);
    talepPayload.requestType = "diger";

    // Eski alan adlarıyla gelebilir → Talepler'e map'le
    const legacyDate = srcDetay.transfer_tarih || srcTalep.transfer_tarih;
    const legacyTime = srcDetay.transfer_saat || srcTalep.transfer_saat;
    if (!talepPayload.transferTarihi && (legacyDate || legacyTime)) {
      const dt = toDateFromParts(legacyDate, legacyTime);
      if (dt) talepPayload.transferTarihi = dt;
      if (legacyTime) talepPayload.transferSaati = legacyTime;
    }

    // 1) Talepler
    const [talepDoc] = await Talepler.create([{ ...talepPayload }], { session });

    // 2) DigerDetay
    const rawDetay = pick(srcDetay, DETAY_FIELDS);
    const sanitizedDetay = Object.fromEntries(
      Object.entries(rawDetay).map(([k, v]) => [k, toNullIfEmpty(v)])
    );

    const [detayDoc] = await DigerDetay.create(
      [{ ...sanitizedDetay, talep_id: talepDoc._id }],
      { session }
    );

    await session.commitTransaction();
    return ok(res, { talep: talepDoc, detay: detayDoc }, 201);
  } catch (err) {
    await session.abortTransaction();
    if (isDup(err)) {
      return fail(res, 409, "Bu talep için detay zaten mevcut (unique talep_id)");
    }
    return fail(res, 400, "Birleştirilmiş oluşturma başarısız", err.message);
  } finally {
    session.endSession();
  }
};

// 3) talep_id ile getir
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return fail(res, 400, "Geçersiz talepId");

    const doc = await DigerDetay.findOne({ talep_id: talepId })
      .select("-__v")
      .lean();
    if (!doc) return fail(res, 404, "Kayıt bulunamadı");
    return ok(res, doc);
  } catch (err) {
    return fail(res, 500, "Getirme hatası", err.message);
  }
};

// 4) talep_id ile güncelle
exports.updateByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return fail(res, 400, "Geçersiz talepId");

    const raw = pick(req.body || {}, DETAY_FIELDS);

    // Yalnızca gönderilen alanları güncelle (undefined'ları yok say)
    const entries = Object.entries(raw).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return fail(res, 400, "Güncellenecek alan yok");

    const payload = Object.fromEntries(
      entries.map(([k, v]) => [k, toNullIfEmpty(v)])
    );

    const updated = await DigerDetay.findOneAndUpdate(
      { talep_id: talepId },
      { $set: payload },
      { new: true, runValidators: true, upsert: false }
    ).select("-__v");

    if (!updated) return fail(res, 404, "Kayıt bulunamadı");
    return ok(res, updated);
  } catch (err) {
    return fail(res, 400, "Güncelleme hatası", err.message);
  }
};

// 5) talep_id ile sil (yalnızca detay kaydı)
exports.deleteByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return fail(res, 400, "Geçersiz talepId");

    const deleted = await DigerDetay.findOneAndDelete({ talep_id: talepId });
    if (!deleted) return fail(res, 404, "Kayıt bulunamadı");
    return ok(res, { message: "Silindi", talep_id: talepId });
  } catch (err) {
    return fail(res, 500, "Silme hatası", err.message);
  }
};

// 6) Detay _id ile getir (opsiyonel yardımcı)
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return fail(res, 400, "Geçersiz id");
    const doc = await DigerDetay.findById(id).select("-__v").lean();
    if (!doc) return fail(res, 404, "Kayıt bulunamadı");
    return ok(res, doc);
  } catch (err) {
    return fail(res, 500, "Getirme hatası", err.message);
  }
};

// 7) Listeleme + filtre + sayfalama
//   GET /diger-detay?talep_tipi=Evrak&alt_tip=Banka&page=1&pageSize=20&search=...&from=2025-01-01&to=2025-12-31
exports.list = async (req, res) => {
  try {
    const {
      talep_tipi,
      alt_tip,
      search,
      from,
      to,
      page = 1,
      pageSize = 20,
    } = req.query || {};

    const q = {};
    if (talep_tipi) q.talep_tipi = talep_tipi;
    if (alt_tip) q.alt_tip = alt_tip;

    // Basit arama (açıklama, nereden, nereye)
    if (search) {
      const re = new RegExp(search, "i");
      q.$or = [{ talep_aciklama: re }, { nereden: re }, { nereye: re }];
    }

    // Oluşturulma tarihine göre aralık
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
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

    const [items, total] = await Promise.all([
      DigerDetay.find(q).select("-__v").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DigerDetay.countDocuments(q),
    ]);

    return ok(res, {
      items,
      total,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return fail(res, 500, "Listeleme hatası", err.message);
  }
};


