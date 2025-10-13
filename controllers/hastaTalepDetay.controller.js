// controllers/hastaTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const HastaDetay = require("../models/talepler/hastaTalepDetay.model");

// Bu modellerin isim/konumlarını projendeki gerçek dosya yollarına göre güncelle
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});

exports.createCombined = async (req, res) => {
};



const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// ——— embedded -> referans normalizer’lar (PUT semantiği: verildiyse değiştir, verilmediyse dokunma) ———
async function ensureCompanionIds(arr, session) {
  if (!Array.isArray(arr)) return null; // null => değişiklik yok
  if (!arr.length) return []; // [] => kaydı boş liste yap
  const ids = [],
    toInsert = [];
  for (const c of arr) {
    if (typeof c === "string" && isId(c))
      ids.push(new mongoose.Types.ObjectId(c));
    else if (c && typeof c === "object") {
      toInsert.push({
        fullName: c.fullName || "",
        passportNo: c.passportNo || "",
      }); // hastaId opsiyonel
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
  const ids = [],
    toInsert = [];
  for (const r of arr) {
    if (typeof r === "string" && isId(r))
      ids.push(new mongoose.Types.ObjectId(r));
    else if (r && typeof r === "object") {
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
  if (obj === null) return null; // null gönderildiyse kaldır
  if (typeof obj === "string" && isId(obj)) return obj;
  if (obj && typeof obj === "object") {
    const [ins] = await NotificationPerson.create(
      [{ fullName: obj.fullName || "", description: obj.description || "" }],
      { session }
    );
    return ins?._id || null;
  }
  return undefined;
}

// ——— PUT /hasta-detay/combined/:talepId ———
exports.updateCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) {
      session.endSession();
      return res.status(400).json({
        message: "Geçersiz talepId",
        data: null,
      });
    }

    // Talep gerçekten var mı ve 'hasta' mı?
    const existingTalep = await Talepler.findById(talepId).session(session);
    if (!existingTalep) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(404).json({
        message: "Talep bulunamadı",
        data: null,
      });
    }
    if (existingTalep.requestType && existingTalep.requestType !== "hasta") {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return res.status(400).json({
        message: "Talep tipi 'hasta' değil",
        data: null,
      });
    }

    const body = req.body || {};
    const srcTalep = body.talep || {};
    const srcDetay = body.detay || {};

    // 1) Talepler (ortak) — yalnızca gönderilen alanları güncelle
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
    const talepSet = pick(srcTalep, talepKeys);

    let talepDoc = existingTalep;
    if (Object.keys(talepSet).length) {
      talepDoc = await Talepler.findByIdAndUpdate(
        talepId,
        { $set: talepSet, $setOnInsert: { requestType: "hasta" } },
        { new: true, session, runValidators: true }
      );
    }

    // 2) HastaDetay — verildiyse güncelle / yoksa oluştur (upsert)
    const detayKeys = [
      "bolge",
      "country",
      "language",
      "wheelchair",
      "donusTarihi",
      "donusSaati",
      "refakatciSayisi",
      "bagajSayisi",
      "aciklama",
      "isBaslamaZamani",
      "isBitisZamani",
      "iptalZamani",
      "iptalNedeni",
    ];
    const setDetay = pick(srcDetay, detayKeys);

    // embedded listeleri normalize et
    const newCompanionIds = await ensureCompanionIds(
      srcDetay.companions,
      session
    ); // null/[]/id[] davranışı
    const newRouteIds = await ensureRouteIds(srcDetay.routes, session);
    const newNotifId = await ensureNotificationId(
      srcDetay.notificationPerson,
      session
    );

    if (newCompanionIds !== null) setDetay.companions = newCompanionIds;
    if (newRouteIds !== null) setDetay.routes = newRouteIds;
    if (newNotifId !== undefined) setDetay.notificationPerson = newNotifId;

    const detayDoc = await HastaDetay.findOneAndUpdate(
      { talep_id: talepId },
      { $set: setDetay, $setOnInsert: { talep_id: talepId } },
      { new: true, upsert: true, session, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();

    // 3) Dönüşte, **populate** edilmiş birleşik obje verelim
    const populatedTalep = await Talepler.findById(talepId)
      .populate([
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
      ])
      .lean();

    const populatedDetay = await HastaDetay.findOne({ talep_id: talepId })
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
      data: {
        talep: populatedTalep,
        detay: populatedDetay || null,
      },
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