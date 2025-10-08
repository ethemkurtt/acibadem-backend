// controllers/digerTalepDetay.controller.js
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

// 1) Tek başına DigerDetay oluştur (opsiyonel talep_id)
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const { talep_id } = body;
    if (talep_id && !isId(talep_id))
      return res.status(400).json({ ok: false, message: "Geçersiz talep_id" });

    const fields = [
      "talep_tipi",
      "talep_tipi_diger",
      "alt_tip",
      "alt_tip_diger",
      "talep_aciklama",
      "nereden",
      "nereye",
    ];

    const payload = { ...pick(body, fields), talep_id: talep_id || null };
    const doc = await DigerDetay.create(payload);
    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    res
      .status(400)
      .json({ ok: false, message: "Diğer detay oluşturulamadı", error: err.message });
  }
};

// 2) Birleştirilmiş oluşturma: Talepler + DigerDetay
// - requestType 'diger' olarak set edilir.
// - Eğer body'de eski alanlar olan transfer_tarih/saat gelirse Talepler.transferTarihi/Saati'ne maplenir.
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Talepler ortak alanlar (opsiyonel)
    const talepKeys = [
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
    const talepPayload = pick(srcTalep, talepKeys);
    talepPayload.requestType = "diger";

    // Eski alan adlarıyla gelebilir → Talepler'e map'le
    // kaynak: srcDetay veya srcTalep (esneklik)
    const legacyDate = srcDetay.transfer_tarih || srcTalep.transfer_tarih;
    const legacyTime = srcDetay.transfer_saat || srcTalep.transfer_saat;
    if (!talepPayload.transferTarihi && (legacyDate || legacyTime)) {
      const dt = toDateFromParts(legacyDate, legacyTime);
      if (dt) talepPayload.transferTarihi = dt;
      if (legacyTime) talepPayload.transferSaati = legacyTime;
    }

    // 1) Talepler
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // 2) DigerDetay
    const detayKeys = [
      "talep_tipi",
      "talep_tipi_diger",
      "alt_tip",
      "alt_tip_diger",
      "talep_aciklama",
      "nereden",
      "nereye",
    ];
    const detayPayload = { ...pick(srcDetay, detayKeys), talep_id: talepDoc._id };

    const [detayDoc] = await DigerDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ ok: true, data: { talep: talepDoc, detay: detayDoc } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({ ok: false, message: "Birleştirilmiş oluşturma başarısız", error: err.message });
  }
};

// 3) talep_id ile getir
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId))
      return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    const doc = await DigerDetay.findOne({ talep_id: talepId }).lean();
    if (!doc) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
    res.json({ ok: true, data: doc });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: "Getirme hatası", error: err.message });
  }
};

// 4) talep_id ile güncelle
exports.updateByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId))
      return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    const fields = [
      "talep_tipi",
      "talep_tipi_diger",
      "alt_tip",
      "alt_tip_diger",
      "talep_aciklama",
      "nereden",
      "nereye",
    ];
    const payload = pick(req.body || {}, fields);

    const updated = await DigerDetay.findOneAndUpdate(
      { talep_id: talepId },
      payload,
      { new: true, runValidators: true, upsert: false }
    );
    if (!updated) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res
      .status(400)
      .json({ ok: false, message: "Güncelleme hatası", error: err.message });
  }
};

// 5) talep_id ile sil
exports.deleteByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId))
      return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    const deleted = await DigerDetay.findOneAndDelete({ talep_id: talepId });
    if (!deleted) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
    res.json({ ok: true, message: "Silindi", talep_id: talepId });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: "Silme hatası", error: err.message });
  }
};
