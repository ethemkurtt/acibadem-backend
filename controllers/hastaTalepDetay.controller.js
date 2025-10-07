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

    const srcTalep = isFlat ? body : (body.talep || {});
    const srcDetay = isFlat ? body : (body.detay || {});

    // --- Ortak talep alanları
    const talepFields = [
      "requestType","fullName","passportNo","phone","lokasyon",
      "arac","sofor","atamaDurumu","transferTipi","transferTarihi","transferSaati",
      "talepDurumu","talepEdenId","isDurumu","atamaYapanId","atamaYapanAdSoyad",
      "uetdsSeferReferansNo","lokasyonSonDegistirenId","description"
    ];
    const talepPayload = pick(srcTalep, talepFields);

    // requestType'ı garanti altına al
    talepPayload.requestType = "hasta";

    // --- Hasta tip-özel alanlar
    const hastaFields = [
      "bolge","country","language","wheelchair","kategori",
      "donusTarihi","donusSaati","refakatciSayisi","bagajSayisi",
      "aciklama","isBaslamaZamani","isBitisZamani","iptalZamani","iptalNedeni"
    ];
    const detayPayload = pick(srcDetay, hastaFields);

    // --- Gömülü listeler / objeler
    const companionsIn = Array.isArray(srcDetay.companions) ? srcDetay.companions
                       : Array.isArray(srcTalep.companions) ? srcTalep.companions : [];
    const routesIn = Array.isArray(srcDetay.routes) ? srcDetay.routes
                    : Array.isArray(srcTalep.routes) ? srcTalep.routes : [];
    const notifIn = srcDetay.notificationPerson || srcTalep.notificationPerson || null;

    // 1) Talep oluştur
    const [talepDoc] = await Talepler.create([talepPayload], { session });

    // 2) Gömülüleri gerçek koleksiyonlara yaz ve id'lerini topla
    let companionIds = [];
    if (companionsIn.length) {
      const companionDocs = companionsIn.map(c => ({
        talep_id: talepDoc._id,
        fullName: c.fullName || "",
        passportNo: c.passportNo || ""
      }));
      const inserted = await Companions.insertMany(companionDocs, { session });
      companionIds = inserted.map(x => x._id);
    }

    let routeIds = [];
    if (routesIn.length) {
      const routeDocs = routesIn.map(r => ({
        talep_id: talepDoc._id,
        pickup: r.pickup || {},
        drop: r.drop || {}
      }));
      const inserted = await Routes.insertMany(routeDocs, { session });
      routeIds = inserted.map(x => x._id);
    }

    let notifId = null;
    if (notifIn && (notifIn.fullName || notifIn.description)) {
      const [ins] = await NotificationPerson.create(
        [{ talep_id: talepDoc._id, fullName: notifIn.fullName || "", description: notifIn.description || "" }],
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
      notificationPerson: notifId
    };

    const [detayDoc] = await HastaDetay.create([detayDocPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // İstersen response'ta sadeleştirilmiş “resolved” alanları da dönebilirsin
    res.status(201).json({
      talep: talepDoc,
      detay: detayDoc
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: "Birleştirilmiş oluşturma başarısız", error: err.message });
  }
};
