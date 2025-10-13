// controllers/personelTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const PersonelDetay = require("../models/talepler/personelTalepDetay.model");

// Projendeki gerçek yollarına göre güncelle:
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});

// -- Yardımcı: companions/routes input'unu normalize et (ID ise direkt, obje ise insert)
async function ensureCompanionIds(arr, talepId, session) {
  if (!Array.isArray(arr) || !arr.length) return [];
  const ids = [];
  const toInsert = [];
  for (const c of arr) {
    if (typeof c === "string" && isId(c)) {
      ids.push(new mongoose.Types.ObjectId(c));
    } else if (c && typeof c === "object") {
      toInsert.push({
        talep_id: talepId || null,
        fullName: c.fullName || "",
        passportNo: c.passportNo || "",
      });
    }
  }
  if (toInsert.length) {
    const inserted = await Companions.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

async function ensureRouteIds(arr, talepId, session) {
  if (!Array.isArray(arr) || !arr.length) return [];
  const ids = [];
  const toInsert = [];
  for (const r of arr) {
    if (typeof r === "string" && isId(r)) {
      ids.push(new mongoose.Types.ObjectId(r));
    } else if (r && typeof r === "object") {
      toInsert.push({
        talep_id: talepId || null,
        pickup: r.pickup || {},
        drop: r.drop || {},
      });
    }
  }
  if (toInsert.length) {
    const inserted = await Routes.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

// Ortak populate şemaları
const TALEP_POPULATE = [
  { path: "lokasyon" },
  { path: "arac" },
  {
    path: "sofor",
    select: "-password -resetPasswordToken -resetPasswordExpires -__v",
  },
  {
    path: "talepEdenId",
    select: "-password -resetPasswordToken -resetPasswordExpires -__v",
  },
  {
    path: "atamaYapanId",
    select: "-password -resetPasswordToken -resetPasswordExpires -__v",
  },
  {
    path: "lokasyonSonDegistirenId",
    select: "-password -resetPasswordToken -resetPasswordExpires -__v",
  },
];

const DETAY_POPULATE = [{ path: "companions" }, { path: "routes" }];

/** 1) Tek başına PersonelDetay oluştur (opsiyonel talep_id) */
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

    // gömülü companions/routes gelmişse önce oluştur, sonra id'leri yaz
    const companionIds = await ensureCompanionIds(body.companions, talep_id, null);
    const routeIds = await ensureRouteIds(body.routes, talep_id, null);

    const fields = ["email", "departman", "soforDurumu", "aciklama"];
    const payload = {
      ...pick(body, fields),
      talep_id: talep_id || null,
      companions: companionIds.length ? companionIds : undefined,
      routes: routeIds.length ? routeIds : undefined,
    };

    const doc = await PersonelDetay.create(payload);

    const populatedDetay = await PersonelDetay.findById(doc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Personel detay başarıyla oluşturuldu",
      data: { talep: null, detay: populatedDetay },
    });
  } catch (err) {
    return res.status(400).json({
      message: "Personel detay oluşturulamadı",
      data: { error: err.message },
    });
  }
};

/** 2) Birleştirilmiş oluşturma: Talepler + PersonelDetay + (companions/routes hydrate) */
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Talepler ortak alanlar (hepsi opsiyonel)
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
    talepPayload.requestType = "personel"; // tipi garanti et

    // Ortak talebi oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // companions/routes normalize
    const companionIds = await ensureCompanionIds(
      srcDetay.companions || srcTalep.companions,
      talepDoc._id,
      session
    );
    const routeIds = await ensureRouteIds(
      srcDetay.routes || srcTalep.routes,
      talepDoc._id,
      session
    );

    // Personel tip-özel alanlar (hepsi opsiyonel)
    const detayKeys = ["email", "departman", "soforDurumu", "aciklama"];
    const detayPayload = {
      ...pick(srcDetay, detayKeys),
      talep_id: talepDoc._id,
      companions: companionIds.length ? companionIds : undefined,
      routes: routeIds.length ? routeIds : undefined,
    };

    const [detayDoc] = await PersonelDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate edilmiş ver
    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await PersonelDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Personel talep ve detay başarıyla oluşturuldu",
      data: { talep: populatedTalep, detay: populatedDetay },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({
      message: "Birleştirilmiş oluşturma başarısız",
      data: { error: err.message },
    });
  }
};

/** 3) talep_id ile getir */
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) {
      return res.status(400).json({
        message: "Geçersiz talepId",
        data: { error: "Invalid talepId format." },
      });
    }

    const talep = await Talepler.findById(talepId).populate(TALEP_POPULATE).lean();
    if (!talep) {
      return res.status(404).json({
        message: "Talep bulunamadı",
        data: { talep: null, detay: null },
      });
    }

    const detay = await PersonelDetay.findOne({ talep_id: talepId })
      .populate(DETAY_POPULATE)
      .lean();

    if (!detay) {
      return res.status(404).json({
        message: "Personel detayı bulunamadı",
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

/** 4) talep_id ile güncelle (upsert=false) */
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

    // companions/routes gömülü geldiyse ek işlemler yap
    const body = req.body || {};
    const companionIds = await ensureCompanionIds(body.companions, talepId, session);
    const routeIds = await ensureRouteIds(body.routes, talepId, session);

    const fields = ["email", "departman", "soforDurumu", "aciklama"];
    const payload = {
      ...pick(body, fields),
    };
    if (companionIds.length) payload.companions = companionIds;
    if (routeIds.length) payload.routes = routeIds;

    const updated = await PersonelDetay.findOneAndUpdate(
      { talep_id: talepId },
      payload,
      { new: true, runValidators: true, upsert: false, session }
    );

    if (!updated) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(404).json({
        message: "Kayıt bulunamadı",
        data: { talep: null, detay: null },
      });
    }

    await session.commitTransaction();
    session.endSession();

    // Güncel populate edilmiş talep + detay döndür
    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await PersonelDetay.findById(updated._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.json({
      message: "Personel detayı başarıyla güncellendi",
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

/** 5) talep_id ile sil */
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

    const deleted = await PersonelDetay.findOneAndDelete({ talep_id: talepId }, { session });
    // Talepler kaydını silmiyoruz; sadece PersonelDetay'ı kaldırıyoruz (iş kuralına göre değiştirilebilir)

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
      message: "Personel detayı silindi",
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
