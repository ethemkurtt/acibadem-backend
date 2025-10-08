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

// 1) Tek başına PersonelDetay oluştur (opsiyonel talep_id)
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const { talep_id } = body;
    if (talep_id && !isId(talep_id)) {
      return res.status(400).json({ ok: false, message: "Geçersiz talep_id" });
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
    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    res.status(400).json({ ok: false, message: "Personel detay oluşturulamadı", error: err.message });
  }
};

// 2) Birleştirilmiş oluşturma: Talepler + PersonelDetay + (companions/routes hydrate)
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body || {};
    const isFlat = !body.talep && !body.detay;

    const srcTalep = isFlat ? body : (body.talep || {});
    const srcDetay = isFlat ? body : (body.detay || {});

    // Talepler ortak alanlar (hepsi opsiyonel)
    const talepKeys = [
      "fullName","passportNo","phone","lokasyon","kategori",
      "arac","sofor","atamaDurumu","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description"
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
    res.status(201).json({ ok: true, data: { talep: talepDoc, detay: detayDoc } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ ok: false, message: "Birleştirilmiş oluşturma başarısız", error: err.message });
  }
};

// 3) talep_id ile getir
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    const doc = await PersonelDetay.findOne({ talep_id: talepId })
      .populate(["companions", "routes"])
      .lean();

    if (!doc) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
    res.json({ ok: true, data: doc });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Getirme hatası", error: err.message });
  }
};

// 4) talep_id ile güncelle (upsert=false)
exports.updateByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    // companions/routes gömülü geldiyse ek işlemler yap
    const body = req.body || {};
    const companionIds = await ensureCompanionIds(body.companions, talepId, null);
    const routeIds = await ensureRouteIds(body.routes, talepId, null);

    const fields = ["email", "departman", "soforDurumu", "aciklama"];
    const payload = {
      ...pick(body, fields),
    };
    if (companionIds.length) payload.companions = companionIds;
    if (routeIds.length) payload.routes = routeIds;

    const updated = await PersonelDetay.findOneAndUpdate(
      { talep_id: talepId },
      payload,
      { new: true, runValidators: true, upsert: false }
    );

    if (!updated) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, message: "Güncelleme hatası", error: err.message });
  }
};

// 5) talep_id ile sil
exports.deleteByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isId(talepId)) return res.status(400).json({ ok: false, message: "Geçersiz talepId" });

    const deleted = await PersonelDetay.findOneAndDelete({ talep_id: talepId });
    if (!deleted) return res.status(404).json({ ok: false, message: "Kayıt bulunamadı" });

    res.json({ ok: true, message: "Silindi", talep_id: talepId });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Silme hatası", error: err.message });
  }
};
