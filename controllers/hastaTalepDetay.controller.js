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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // İki şekli de destekle: { talep, detay } veya flat body
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : body.talep || {};
    const srcDetay = isFlat ? body : body.detay || {};

    // --- Ortak talep alanları
    const talepFields = [
      "requestType",
      "fullName",
      "passportNo",
      "phone",
      "lokasyon",
      "kategori",
      "arac",
      "sofor",
      "atamaDurumu",
      "transferTipi",
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
    const talepPayload = pick(srcTalep, talepFields);

    // requestType'ı garanti altına al
    talepPayload.requestType = "hasta";

    // --- Hasta tip-özel alanlar
    const hastaFields = [
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
    const detayPayload = pick(srcDetay, hastaFields);

    // --- Gömülü listeler / objeler
    const companionsIn = Array.isArray(srcDetay.companions)
      ? srcDetay.companions
      : Array.isArray(srcTalep.companions)
      ? srcTalep.companions
      : [];
    const routesIn = Array.isArray(srcDetay.routes)
      ? srcDetay.routes
      : Array.isArray(srcTalep.routes)
      ? srcTalep.routes
      : [];
    const notifIn =
      srcDetay.notificationPerson || srcTalep.notificationPerson || null;

    // 1) Talep oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // 2) Gömülüleri gerçek koleksiyonlara yaz ve id'lerini topla
    let companionIds = [];
    if (companionsIn.length) {
      const companionDocs = companionsIn.map((c) => ({
        talep_id: talepDoc._id,
        fullName: c.fullName || "",
        passportNo: c.passportNo || "",
      }));
      const inserted = await Companions.insertMany(companionDocs, { session });
      companionIds = inserted.map((x) => x._id);
    }

    let routeIds = [];
    if (routesIn.length) {
      const routeDocs = routesIn.map((r) => ({
        talep_id: talepDoc._id,
        pickup: r.pickup || {},
        drop: r.drop || {},
      }));
      const inserted = await Routes.insertMany(routeDocs, { session });
      routeIds = inserted.map((x) => x._id);
    }

    let notifId = null;
    if (notifIn && (notifIn.fullName || notifIn.description)) {
      const [ins] = await NotificationPerson.create(
        [
          {
            talep_id: talepDoc._id,
            fullName: notifIn.fullName || "",
            description: notifIn.description || "",
          },
        ],
        { session }
      );
      notifId = ins._id;
    }

    // 3) HastaDetay oluştur (ilişkileri id olarak yaz)
    const detayDocPayload = {
      ...detayPayload,
      talep_id: talepDoc._id,
      companions: companionIds,
      routes: routeIds,
      notificationPerson: notifId,
    };

    const [detayDoc] = await HastaDetay.create([detayDocPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // İstersen response'ta sadeleştirilmiş “resolved” alanları da dönebilirsin
    res.status(201).json({
      talep: talepDoc,
      detay: detayDoc,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({
        message: "Birleştirilmiş oluşturma başarısız",
        error: err.message,
      });
  }
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
      await session.endSession(); // guard
      return res.status(400).json({ ok: false, message: "Geçersiz talepId" });
    }

    // Talep gerçekten 'hasta' mı?
    const existingTalep = await Talepler.findById(talepId).session(session);
    if (!existingTalep) throw new Error("Talep bulunamadı");
    if (existingTalep.requestType && existingTalep.requestType !== "hasta") {
      throw new Error("Talep tipi 'hasta' değil");
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

    if (newCompanionIds !== null) setDetay.companions = newCompanionIds; // null değilse güncelle
    if (newRouteIds !== null) setDetay.routes = newRouteIds;
    if (newNotifId !== undefined) setDetay.notificationPerson = newNotifId; // undefined ise dokunma

    const detayDoc = await HastaDetay.findOneAndUpdate(
      { talep_id: talepId },
      { $set: setDetay, $setOnInsert: { talep_id: talepId } },
      { new: true, upsert: true, session, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();

    // 3) Dönüşte, **tam populate** edilmiş birleşik obje verelim
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
        { path: "companions" }, // 🔹 tüm companion alanları
        { path: "routes" }, // 🔹 tüm route alanları (pickup/drop dahil)
        { path: "notificationPerson" }, // 🔹 tüm notification alanları
        { path: "bolge" },
        { path: "country" },
      ])
      .lean();

    return res.json({
      ok: true,
      data: {
        talep: populatedTalep,
        detay: populatedDetay || null,
      },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res
      .status(400)
      .json({
        ok: false,
        message: "Hasta talep güncellenemedi",
        error: err.message,
      });
  }
};
