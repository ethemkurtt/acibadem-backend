// controllers/hastaTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const HastaDetay = require("../models/talepler/hastaTalepDetay.model");

// Bu modellerin isim/konumlarını projendeki gerçek dosya yollarına göre güncelle
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");

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
        talep_id: talepId || null,           // şeman uygunsa dursun; değilse model bunu yok sayar
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
      [{
        talep_id: talepId || null,
        fullName: obj.fullName || "",
        description: obj.description || ""
      }],
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
      [{
        talep_id: talepId || null,
        fullName: obj.fullName || "",
        description: obj.description || ""
      }],
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

/* ------------------------ 1) Talepler + HastaDetay birlikte oluştur ------------------------ */
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // { talep, detay } veya flat body
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Talepler payload
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description","talepEdenAdSoyad",
    ];
    const talepPayload = pick(srcTalep, talepKeys);
    talepPayload.requestType = "hasta";
    if (talepPayload.atamaDurumu == null) talepPayload.atamaDurumu = "Hayır";

    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // nested listeler sadece detay’dan al (misafir ile aynı davranış)
    const companionsIn = Array.isArray(srcDetay.companions) ? srcDetay.companions : [];
    const routesIn     = Array.isArray(srcDetay.routes) ? srcDetay.routes : [];
    const notifIn      = srcDetay.notificationPerson || null;

    const companionIds = await ensureCompanionIds(companionsIn, talepDoc._id, session);
    const routeIds     = await ensureRouteIds(routesIn, talepDoc._id, session);
    const notifId      = await ensureNotificationId(notifIn, talepDoc._id, session);

    // HastaDetay payload
    const detayKeys = [
      "bolge","country","language","wheelchair",
      "donusTarihi","donusSaati","refakatciSayisi","bagajSayisi",
      "aciklama","isBaslamaZamani","isBitisZamani","iptalZamani","iptalNedeni",
    ];
    const detayPayload = {
      ...pick(srcDetay, detayKeys),
      talep_id: talepDoc._id,
      companions: companionIds,
      routes: routeIds,
      notificationPerson: notifId,
    };

    const [detayDoc] = await HastaDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate
    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await HastaDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.status(201).json({
      message: "Hasta talep ve detay başarıyla oluşturuldu",
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

/* -------------- 2) PUT /hasta-detay/combined/:talepId (ikisini birden güncelle) -------------- */
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
    if (existingTalep.requestType && existingTalep.requestType !== "hasta") {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Talep tipi 'hasta' değil",
        data: { error: "Mismatched requestType" },
      });
    }

    const body = req.body || {};
    const srcTalep = body.talep || {};
    const srcDetay = body.detay || {};

    // Talepler — yalnızca gönderilen alanları güncelle
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description","talepEdenAdSoyad",
    ];
    const talepSet = pick(srcTalep, talepKeys);
    if (Object.keys(talepSet).length) {
      talepSet.requestType = "hasta"; // koru
      await Talepler.findByIdAndUpdate(
        talepId,
        { $set: talepSet },
        { new: true, session, runValidators: true }
      );
    }

    // HastaDetay — tri-state set
    const detayKeys = [
      "bolge","country","language","wheelchair",
      "donusTarihi","donusSaati","refakatciSayisi","bagajSayisi",
      "aciklama","isBaslamaZamani","isBitisZamani","iptalZamani","iptalNedeni",
    ];
    const setDetay = pick(srcDetay, detayKeys);

    const newCompanionIds = await ensureCompanionIdsForUpdate(srcDetay.companions, talepId, session);
    const newRouteIds     = await ensureRouteIdsForUpdate(srcDetay.routes, talepId, session);
    const newNotifId      = await ensureNotificationIdForUpdate(srcDetay.notificationPerson, talepId, session);

    const updateDoc = { $set: setDetay, $setOnInsert: { talep_id: talepId } };
    if (newCompanionIds !== null) updateDoc.$set.companions = newCompanionIds;
    if (newRouteIds !== null)     updateDoc.$set.routes     = newRouteIds;
    if (newNotifId !== undefined) updateDoc.$set.notificationPerson = newNotifId;

    const detayDoc = await HastaDetay.findOneAndUpdate(
      { talep_id: talepId },
      updateDoc,
      { new: true, upsert: true, session, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate
    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();

    const populatedDetay = await HastaDetay.findById(detayDoc._id)
      .populate(DETAY_POPULATE)
      .lean();

    return res.json({
      message: "Hasta talep ve detay başarıyla güncellendi",
      data: { talep: populatedTalep, detay: populatedDetay || null },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({
      message: "Hasta talep güncellenemedi",
      data: { error: err.message },
    });
  }
};
