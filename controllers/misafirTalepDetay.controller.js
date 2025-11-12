// controllers/misafirTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const MisafirDetay = require("../models/talepler/misafirTalepDetay.model");

// Projendeki gerçek yollarına göre güncelle:
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");

// ⚡ Optimizasyon araçları
const taleplerOptimizer = require("../utils/taleplerOptimizer");

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});

/* ------------------------ CREATE normalizer’ları ------------------------ */
async function ensureCompanionIds(arr, talepId, session) {
  if (!Array.isArray(arr) || !arr.length) return [];
  const ids = [], toInsert = [];
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
  const ids = [], toInsert = [];
  for (const r of arr) {
    if (typeof r === "string" && isId(r)) {
      ids.push(new mongoose.Types.ObjectId(r));
    } else if (r && typeof r === "object") {
      toInsert.push({
        talep_id: talepId || null,
        pickup: r.pickup || r.pickUp || r.gidis || r.from || {},
        drop:   r.drop   || r.to     || {},
      });
    }
  }
  if (toInsert.length) {
    const inserted = await Routes.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

async function ensureNotificationId(obj, talepId, session) {
  if (!obj) return null;
  if (typeof obj === "string" && isId(obj)) return new mongoose.Types.ObjectId(obj);
  if (obj && typeof obj === "object") {
    const [ins] = await NotificationPerson.create(
      [{ talep_id: talepId || null, fullName: obj.fullName || "", description: obj.description || "" }],
      { session }
    );
    return ins?._id || null;
  }
  return null;
}

/* ------------------------ UPDATE tri-state normalizer’ları ------------------------
   arrays: undefined -> dokunma, [] -> boşalt, [id|obj] -> set/insert
   notification: undefined -> dokunma, null -> kaldır, id|obj -> set/insert
---------------------------------------------------------------------------- */
async function ensureCompanionIdsForUpdate(arr, talepId, session) {
  if (arr === undefined) return null;
  if (!Array.isArray(arr)) return null;
  if (arr.length === 0) return [];
  const ids = [], toInsert = [];
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

async function ensureRouteIdsForUpdate(arr, talepId, session) {
  if (arr === undefined) return null;
  if (!Array.isArray(arr)) return null;
  if (arr.length === 0) return [];
  const ids = [], toInsert = [];
  for (const r of arr) {
    if (typeof r === "string" && isId(r)) {
      ids.push(new mongoose.Types.ObjectId(r));
    } else if (r && typeof r === "object") {
      toInsert.push({
        talep_id: talepId || null,
        pickup: r.pickup || r.pickUp || r.gidis || r.from || {},
        drop:   r.drop   || r.to     || {},
      });
    }
  }
  if (toInsert.length) {
    const inserted = await Routes.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

async function ensureNotificationIdForUpdate(obj, talepId, session) {
  if (obj === undefined) return undefined; // dokunma
  if (obj === null) return null;           // kaldır
  if (typeof obj === "string" && isId(obj)) return new mongoose.Types.ObjectId(obj);
  if (obj && typeof obj === "object") {
    const [ins] = await NotificationPerson.create(
      [{ talep_id: talepId || null, fullName: obj.fullName || "", description: obj.description || "" }],
      { session }
    );
    return ins?._id || null;
  }
  return undefined;
}

/* ------------------------ Populate şemaları ------------------------ */
const TALEP_POPULATE = [
  { path: "lokasyon" },
  { path: "arac" },
  { path: "sofor", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "talepEdenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "atamaYapanId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
  { path: "lokasyonSonDegistirenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
];

const DETAY_POPULATE = [
  { path: "companions" },
  { path: "routes" },
  { path: "notificationPerson" },
  { path: "bolge" },
  { path: "country" },
];

/* ------------------------ 1) Sadece MisafirDetay oluştur ------------------------ */
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const companionIds = await ensureCompanionIds(body.companions, talep_id || null, session);
      const routeIds     = await ensureRouteIds(body.routes, talep_id || null, session);
      const notifId      = await ensureNotificationId(body.notificationPerson, talep_id || null, session);

      const fields = ["bolge", "country", "language", "wheelchair", "aciklama"];
      const payload = {
        ...pick(body, fields),
        talep_id: talep_id || null,
        companions: companionIds.length ? companionIds : undefined,
        routes: routeIds.length ? routeIds : undefined,
        notificationPerson: notifId || undefined,
    };

      const doc = await MisafirDetay.create(payload, { session });

      await session.commitTransaction();
      session.endSession();

      const populatedDetay = await MisafirDetay.findById(doc._id)
        .populate(DETAY_POPULATE)
        .lean();

      return res.status(201).json({
        message: "Misafir detay başarıyla oluşturuldu",
        data: { talep: null, detay: populatedDetay },
      });
    } catch (e) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      throw e;
    }
  } catch (err) {
    return res.status(400).json({
      message: "Misafir detay oluşturulamadı",
      data: { error: err.message },
    });
  }
};

/* ------------------------ 2) Talepler + MisafirDetay birlikte oluştur ------------------------ */
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // { talep, detay } veya flat body
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description","talepEdenAdSoyad"
    ];
    const talepPayload = pick(srcTalep, talepKeys);
    talepPayload.requestType = "misafir";

    const [talepDoc] = await Talepler.create([talepPayload], { session });

    const companionsIn = Array.isArray(srcDetay.companions) ? srcDetay.companions : [];
    const routesIn     = Array.isArray(srcDetay.routes) ? srcDetay.routes : [];
    const notifIn      = srcDetay.notificationPerson || null;

    const companionIds = await ensureCompanionIds(companionsIn, talepDoc._id, session);
    const routeIds     = await ensureRouteIds(routesIn, talepDoc._id, session);
    const notifId      = await ensureNotificationId(notifIn, talepDoc._id, session);

    const detayKeys = ["bolge","country","language","wheelchair","aciklama"];
    const detayPayload = {
      ...pick(srcDetay, detayKeys),
      talep_id: talepDoc._id,
      companions: companionIds,
      routes: routeIds,
      notificationPerson: notifId,
    };

    const [detayDoc] = await MisafirDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await MisafirDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Misafir talep ve detay başarıyla oluşturuldu",
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

/* ------------------------ 3) talep_id ile getir ------------------------ */
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

    const detay = await MisafirDetay.findOne({ talep_id: talepId })
      .populate(DETAY_POPULATE)
      .lean();

    if (!detay) {
      return res.status(404).json({
        message: "Misafir detayı bulunamadı",
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

/* ------------------------ 4) PUT /misafir-detay/combined/:talepId (ikisini birden güncelle) ------------------------ */
exports.updateCombined = async (req, res) => {
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

    const existingTalep = await Talepler.findById(talepId).session(session);
    if (!existingTalep) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(404).json({
        message: "Talep bulunamadı",
        data: { talep: null, detay: null },
      });
    }
    if (existingTalep.requestType && existingTalep.requestType !== "misafir") {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Talep tipi 'misafir' değil",
        data: { error: "Mismatched requestType" },
      });
    }

    const body = req.body || {};
    const srcTalep = body.talep || {};
    const srcDetay = body.detay || {};

    // Talepler set
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description","talepEdenAdSoyad"
    ];
    const talepSet = pick(srcTalep, talepKeys);
    talepSet.requestType = "misafir";

    await Talepler.findByIdAndUpdate(
      talepId,
      { $set: talepSet },
      { new: true, session, runValidators: true }
    );

    // MisafirDetay set
    const detayKeys = ["bolge","country","language","wheelchair","aciklama"];
    const setDetay = pick(srcDetay, detayKeys);

    const newCompanionIds = await ensureCompanionIdsForUpdate(srcDetay.companions, talepId, session);
    const newRouteIds     = await ensureRouteIdsForUpdate(srcDetay.routes, talepId, session);
    const newNotifId      = await ensureNotificationIdForUpdate(srcDetay.notificationPerson, talepId, session);

    const updateDoc = { $set: setDetay, $setOnInsert: { talep_id: talepId } };
    if (newCompanionIds !== null) updateDoc.$set.companions = newCompanionIds;
    if (newRouteIds !== null)     updateDoc.$set.routes     = newRouteIds;
    if (newNotifId !== undefined) updateDoc.$set.notificationPerson = newNotifId;

    const detayDoc = await MisafirDetay.findOneAndUpdate(
      { talep_id: talepId },
      updateDoc,
      { new: true, upsert: true, session, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await MisafirDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.json({
      message: "Misafir talep ve detay başarıyla güncellendi",
      data: { talep: populatedTalep, detay: populatedDetay || null },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({
      message: "Misafir talep güncellenemedi",
      data: { error: err.message },
    });
  }
};

/* ------------------------ 5) PUT /misafir-detay/:talepId (sadece Detay) ------------------------ */
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
    const inDetay = body.detay || {};

    const newCompanionIds = await ensureCompanionIdsForUpdate(
      body.hasOwnProperty("companions") ? body.companions : inDetay.companions,
      talepId,
      session
    );
    const newRouteIds = await ensureRouteIdsForUpdate(
      body.hasOwnProperty("routes") ? body.routes : inDetay.routes,
      talepId,
      session
    );
    const newNotifId = await ensureNotificationIdForUpdate(
      body.hasOwnProperty("notificationPerson") ? body.notificationPerson : inDetay.notificationPerson,
      talepId,
      session
    );

    const fields = ["bolge","country","language","wheelchair","aciklama"];
    const setDetay = { ...pick(body, fields), ...pick(inDetay, fields) };

    const updateDoc = { $set: setDetay };
    if (newCompanionIds !== null) updateDoc.$set.companions = newCompanionIds;
    if (newRouteIds !== null)     updateDoc.$set.routes     = newRouteIds;
    if (newNotifId !== undefined) updateDoc.$set.notificationPerson = newNotifId;

    const updated = await MisafirDetay.findOneAndUpdate(
      { talep_id: talepId },
      updateDoc,
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

    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await MisafirDetay.findById(updated._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.json({
      message: "Misafir detayı başarıyla güncellendi",
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

/* ------------------------ 6) DELETE /misafir-detay/:talepId ------------------------ */
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

    const deleted = await MisafirDetay.findOneAndDelete({ talep_id: talepId }, { session });
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
      message: "Misafir detayı silindi",
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
