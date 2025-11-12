// controllers/personelTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const PersonelDetay = require("../models/talepler/personelTalepDetay.model");

// Projendeki gerçek yollarına göre güncelle:
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");

// ⚡ Optimizasyon araçları
const taleplerOptimizer = require("../utils/taleplerOptimizer");
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});

// ---------- CREATE senaryosu için normalizer (companions) ----------
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

// ---------- UPDATE (PUT) için tri-state normalizer (companions) ----------
async function ensureCompanionIdsForUpdate(arr, talepId, session) {
  if (arr === undefined) return null;   // dokunma
  if (!Array.isArray(arr)) return null; // beklenmedik format -> dokunma
  if (arr.length === 0) return [];      // boşalt
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

const DETAY_POPULATE = [{ path: "companions" }]; // routes kaldırıldı

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

    // companions normalize (mevcut davranış)
    const companionIds = await ensureCompanionIds(body.companions, talep_id, null);

    // routes normalize (hasta örneği ile aynı mantık)
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
    const routeIds = await ensureRouteIds(body.routes, talep_id, null);

    // Yeni şema alanları
    const fields = [
      "email",
      "departman",
      "aciklama",
      "soforDurumu",
      "alinacakYer",
      "birakilacakYer",
      "alinacakTarih",
      "birakilacakTarih",
      "alinacak_il_kodu",
      "alinacak_ilce_kodu",
      "birakilacak_il_kodu",
      "birakilacak_ilce_kodu",
      "alinacak_aciklama",
      "birakilacak_aciklama",
      "alinacak_kisi_sayisi",
      "birakilacak_kisi_sayisi",
    ];

    const payload = {
      ...pick(body, fields),
      talep_id: talep_id || null,
      companions: companionIds.length ? companionIds : undefined,
      routes: routeIds.length ? routeIds : undefined,
    };

    const doc = await PersonelDetay.create(payload);

    // Dönüşte companions + routes populate
    const populatedDetay = await PersonelDetay.findById(doc._id)
      .populate({ path: "companions" })
      .populate({ path: "routes" })
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

/** 2) Birleştirilmiş oluşturma: Talepler + PersonelDetay + (companions hydrate) */
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
      "talepEdenAdSoyad",
    ];
    const talepPayload = pick(srcTalep, talepKeys);
    talepPayload.requestType = "personel"; // garanti et

    // 1) Talep oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // 2) companions normalize (mevcut davranış: detay > talep fallback)
    const companionsIn = Array.isArray(srcDetay.companions)
      ? srcDetay.companions
      : Array.isArray(srcTalep.companions)
      ? srcTalep.companions
      : [];
    const companionIds = await ensureCompanionIds(companionsIn, talepDoc._id, session);

    // 3) routes normalize (hasta örneği gibi sadece detay’dan almayı tercih edebilirdik,
    // ancak mevcut companions mantığıyla tutarlılık için önce detay, yoksa talep’ten oku)
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
    const routesIn =
      Array.isArray(srcDetay.routes)
        ? srcDetay.routes
        : Array.isArray(srcTalep.routes)
        ? srcTalep.routes
        : [];
    const routeIds = await ensureRouteIds(routesIn, talepDoc._id, session);

    // 4) PersonelDetay oluştur (yeni şema alanları)
    const detayKeys = [
      "email",
      "departman",
      "aciklama",
      "soforDurumu",
      "alinacakYer",
      "birakilacakYer",
      "alinacakTarih",
      "birakilacakTarih",
      "alinacak_il_kodu",
      "alinacak_ilce_kodu",
      "birakilacak_il_kodu",
      "birakilacak_ilce_kodu",
      "alinacak_aciklama",
      "birakilacak_aciklama",
      "alinacak_kisi_sayisi",
      "birakilacak_kisi_sayisi",
    ];
    const detayPayload = {
      ...pick(srcDetay, detayKeys),
      talep_id: talepDoc._id,
      companions: companionIds,
      routes: routeIds,
    };

    const [detayDoc] = await PersonelDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // Dönüşte populate edilmiş ver
    const populatedTalep = await Talepler.findById(talepDoc._id)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await PersonelDetay.findById(detayDoc._id)
      .populate({ path: "companions" })
      .populate({ path: "routes" })
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

    const talep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
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

/** 4) talep_id ile GÜNCELLE (ikisini birden) — flat + nested gövde, tri-state companions */
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

    // --- Talepler (ortak) alanlarını güncelle ---
    const srcTalep = body.talep || {};
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId",
      "atamaYapanAdSoyad","uetdsSeferReferansNo","lokasyonSonDegistirenId",
      "description","talepEdenAdSoyad"
    ];
    const talepSet = pick(srcTalep, talepKeys);
    if (Object.keys(talepSet).length) {
      talepSet.requestType = "personel"; // tipi güvene al
      await Talepler.findByIdAndUpdate(
        talepId,
        { $set: talepSet },
        { new: true, session, runValidators: true }
      );
    }

    // --- PersonelDetay: companions tri-state + routes tri-state + yeni şema alanları ---
    const inDetay = body.detay || {};

    const companionsIn = body.hasOwnProperty("companions")
      ? body.companions
      : inDetay.companions;

    const newCompanionIds = await ensureCompanionIdsForUpdate(companionsIn, talepId, session);

    // routes tri-state (undefined -> dokunma, [] -> boşalt, [id|obj] -> set/insert)
    async function ensureRouteIdsForUpdate(arr, talepId, session) {
      if (arr === undefined) return null;   // dokunma
      if (!Array.isArray(arr)) return null; // beklenmedik format -> dokunma
      if (arr.length === 0) return [];      // boşalt
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

    const routesIn = body.hasOwnProperty("routes")
      ? body.routes
      : inDetay.routes;

    const newRouteIds = await ensureRouteIdsForUpdate(routesIn, talepId, session);

    const fields = [
      "email",
      "departman",
      "aciklama",
      "soforDurumu",
      "alinacakYer",
      "birakilacakYer",
      "alinacakTarih",
      "birakilacakTarih",
      "alinacak_il_kodu",
      "alinacak_ilce_kodu",
      "birakilacak_il_kodu",
      "birakilacak_ilce_kodu",
      "alinacak_aciklama",
      "birakilacak_aciklama",
      "alinacak_kisi_sayisi",
      "birakilacak_kisi_sayisi",
    ];
    const baseSet = { ...pick(body, fields), ...pick(inDetay, fields) };

    const updateDoc = { $set: baseSet };
    if (newCompanionIds !== null) updateDoc.$set.companions = newCompanionIds;
    if (newRouteIds !== null)     updateDoc.$set.routes     = newRouteIds;

    const updated = await PersonelDetay.findOneAndUpdate(
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

    // Dönüşte populate
    const populatedTalep = await Talepler.findById(talepId)
      .populate(TALEP_POPULATE)
      .lean();
    const populatedDetay = await PersonelDetay.findById(updated._id)
      .populate({ path: "companions" })
      .populate({ path: "routes" })
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

    const deleted = await PersonelDetay.findOneAndDelete(
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
