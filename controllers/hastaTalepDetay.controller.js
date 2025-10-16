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

/* --------------------------------- Helpers -------------------------------- */
async function ensureCompanionIds(arr, session) {
  if (!Array.isArray(arr)) return null;   // null => değişiklik yok
  if (!arr.length) return [];             // []   => boş liste yap
  const ids = [], toInsert = [];
  for (const c of arr) {
    if (typeof c === "string" && isId(c)) {
      ids.push(new mongoose.Types.ObjectId(c));
    } else if (c && typeof c === "object") {
      toInsert.push({
        fullName: c.fullName || "",
        passportNo: c.passportNo || "",
      }); // hastaId opsiyonel (şemanı bozmuyorum)
    }
  }
  if (toInsert.length) {
    const inserted = await Companions.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

async function ensureRouteIds(arr, session) {
  if (!Array.isArray(arr)) return null;
  if (!arr.length) return [];
  const ids = [], toInsert = [];
  for (const r of arr) {
    if (typeof r === "string" && isId(r)) {
      ids.push(new mongoose.Types.ObjectId(r));
    } else if (r && typeof r === "object") {
      toInsert.push({ pickup: r.pickup || {}, drop: r.drop || {} });
    }
  }
  if (toInsert.length) {
    const inserted = await Routes.insertMany(toInsert, { session });
    ids.push(...inserted.map((d) => d._id));
  }
  return ids;
}

async function ensureNotificationId(obj, session) {
  if (obj === undefined) return undefined; // hiç gönderilmediyse dokunma
  if (obj === null) return null;           // null gönderildiyse kaldır
  if (typeof obj === "string" && isId(obj)) return new mongoose.Types.ObjectId(obj);
  if (obj && typeof obj === "object") {
    const [ins] = await NotificationPerson.create(
      [{ fullName: obj.fullName || "", description: obj.description || "" }],
      { session }
    );
    return ins?._id || null;
  }
  return undefined;
}

/* ------------------------ createCombined (Talep + Detay) ------------------------ */
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // { talep, detay } veya flat
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // Ortak talep alanları
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description","talepEdenAdSoyad",
    ];
    const talepPayload = pick(srcTalep, talepKeys);

    // requestType'ı garanti et (HASTA)
    talepPayload.requestType = "hasta";
    // atamaDurumu default
    if (talepPayload.atamaDurumu == null) talepPayload.atamaDurumu = "Hayır";

    // Talep oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // Gömülü listeler (detaydan, yoksa talep içinden)
    const companionsIn =
      Array.isArray(srcDetay.companions) ? srcDetay.companions :
      (Array.isArray(srcTalep.companions) ? srcTalep.companions : []);
    const routesIn =
      Array.isArray(srcDetay.routes) ? srcDetay.routes :
      (Array.isArray(srcTalep.routes) ? srcTalep.routes : []);
    const notifIn = srcDetay.notificationPerson;

    const companionIds = await ensureCompanionIds(companionsIn, session);
    const routeIds     = await ensureRouteIds(routesIn, session);
    const notifId      = await ensureNotificationId(notifIn, session);

    // HastaDetay alanları
    const detayKeys = [
      "bolge","country","language","wheelchair",
      "donusTarihi","donusSaati","refakatciSayisi","bagajSayisi",
      "aciklama","isBaslamaZamani","isBitisZamani","iptalZamani","iptalNedeni",
    ];
    const detayPayload = {
      ...pick(srcDetay, detayKeys),
      talep_id: talepDoc._id,
      ...(companionIds !== null ? { companions: companionIds } : {}),
      ...(routeIds     !== null ? { routes: routeIds } : {}),
      ...(notifId      !== undefined ? { notificationPerson: notifId } : {}),
    };

    const [detayDoc] = await HastaDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate
    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate([
        { path: "lokasyon" },
        { path: "arac" },
        { path: "sofor", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "talepEdenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "atamaYapanId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "lokasyonSonDegistirenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
      ])
      .lean();

    const populatedDetay = await HastaDetay.findById(detayDoc._id)
      .populate([
        { path: "companions" },
        { path: "routes" },
        { path: "notificationPerson" },
        { path: "bolge" },
        { path: "country" },
      ])
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

/* -------------- PUT /hasta-detay/combined/:talepId (ikisini birden güncelle) -------------- */
exports.updateCombined = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description",
    ];
    const talepSet = pick(srcTalep, talepKeys);

    if (Object.keys(talepSet).length) {
      await Talepler.findByIdAndUpdate(
        talepId,
        { $set: talepSet, $setOnInsert: { requestType: "hasta" } },
        { new: true, session, runValidators: true }
      );
    }

    // HastaDetay — verildiyse güncelle / yoksa oluştur (upsert)
    const detayKeys = [
      "bolge","country","language","wheelchair",
      "donusTarihi","donusSaati","refakatciSayisi","bagajSayisi",
      "aciklama","isBaslamaZamani","isBitisZamani","iptalZamani","iptalNedeni",
    ];
    const setDetay = pick(srcDetay, detayKeys);

    const newCompanionIds = await ensureCompanionIds(srcDetay.companions, session); // null/[]/id[]
    const newRouteIds     = await ensureRouteIds(srcDetay.routes, session);
    const newNotifId      = await ensureNotificationId(srcDetay.notificationPerson, session);

    if (newCompanionIds !== null) setDetay.companions = newCompanionIds;
    if (newRouteIds !== null)     setDetay.routes     = newRouteIds;
    if (newNotifId !== undefined) setDetay.notificationPerson = newNotifId;

    const detayDoc = await HastaDetay.findOneAndUpdate(
      { talep_id: talepId },
      { $set: setDetay, $setOnInsert: { talep_id: talepId } },
      { new: true, upsert: true, session, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate
    const populatedTalep = await Talepler.findById(talepId)
      .populate([
        { path: "lokasyon" },
        { path: "arac" },
        { path: "sofor", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "talepEdenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "atamaYapanId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
        { path: "lokasyonSonDegistirenId", select: "-password -resetPasswordToken -resetPasswordExpires -__v" },
      ])
      .lean();

    const populatedDetay = await HastaDetay.findById(detayDoc._id)
      .populate([
        { path: "companions" },
        { path: "routes" },
        { path: "notificationPerson" },
        { path: "bolge" },
        { path: "country" },
      ])
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
