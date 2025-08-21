const path = require("path");
const fs = require("fs");

// MODELLER — misafir için ayrı koleksiyonlar önerilir
const MisafirTalep = require("../models/misafirTalepModels/misafirTalep.model");
const MisafirCompanions = require("../models/misafirTalepModels/companions.model");
const MisafirRoutes = require("../models/misafirTalepModels/routes.model");
const MisafirNotificationPerson = require("../models/misafirTalepModels/notificationPerson.model"); // varsa

const Bolge = require("../models/bolge.model");
const Ulke = require("../models/ulke.model");

/* =============================================
   yardımcılar
============================================= */
const toNullIfEmpty = (v) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const normalizeWheelchair = (v) => {
  if (!v) return "Hayır";
  const s = String(v).toLowerCase();
  return s.includes("evet") ? "Evet" : "Hayır";
};

// Laravel body → misafir talep map
const mapFromLaravel = (body = {}) => {
  // Boş stringleri normalize et
  Object.keys(body).forEach((k) => {
    body[k] = toNullIfEmpty(body[k]);
  });

  // Yolcular gelebilir: JSON string/dizi
  let companions = [];
  const rawYolcular = body.misafir_yolcular ?? body.companions;
  if (Array.isArray(rawYolcular)) {
    companions = rawYolcular;
  } else if (typeof rawYolcular === "string") {
    try {
      companions = JSON.parse(rawYolcular);
    } catch {
      companions = [];
    }
  }

  // Rotalar
  const routes = Array.isArray(body.misafir_routes)
    ? body.misafir_routes
    : Array.isArray(body.routes)
    ? body.routes
    : [];

  // Notification (opsiyonel)
  const notificationPerson = body.notificationPerson || null;

  // Asıl talep alanları
  const talep = {
    requestType: "misafir",
    fullName: body.misafir_adSoyad,
    passportNo: body.misafir_tcPasaport,
    phone: body.misafir_gsm,
    bolge: body.misafir_bolge || null,
    country: body.misafir_ulke || null,
    language: body.misafir_language || null,
    wheelchair: normalizeWheelchair(body.misafir_sandalye),
    lokasyon: body.misafir_lokasyon,
    kategori: "Misafir",
    aciklama: body.misafir_aciklama || null,
  };

  return { talep, companions, routes, notificationPerson };
};

// tek route kaydı oluşturma (misafir)
const createRouteRecord = async (misafirId, routeData) => {
  const processSide = (side) => {
    if (!routeData[side]) return null;
    const sideData = { ...routeData[side] };

    // locationId boşsa kaldır
    if (!sideData.locationId || sideData.locationId === "") {
      delete sideData.locationId;
    }
    // ticket string ise sakla
    if (routeData[side].ticket && routeData[side].ticket !== "") {
      sideData.ticket = routeData[side].ticket;
    } else {
      delete sideData.ticket;
    }
    // passport dizi geldiyse stringe çevir
    if (Array.isArray(routeData[side].passport) && routeData[side].passport.length) {
      sideData.passport = routeData[side].passport.join(", ");
    } else if (routeData[side].passport && routeData[side].passport !== "") {
      sideData.passport = routeData[side].passport;
    } else {
      delete sideData.passport;
    }
    return sideData;
  };

  return await MisafirRoutes.create({
    misafirId,
    pickup: processSide("pickup"),
    drop: processSide("drop"),
  });
};

/* =============================================
   CREATE  (POST /api/misafir-talep)
============================================= */
exports.createMisafirTalep = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body._token;
    delete body._method;

    const { talep, companions = [], routes = [], notificationPerson } = mapFromLaravel(body);

    // zorunlu alan kontrolü
    if (!talep.fullName || !talep.passportNo || !talep.phone || !talep.lokasyon) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: "fullName, passportNo, phone ve lokasyon zorunludur.",
      });
    }

    // 1) Talep
    const newTalep = await MisafirTalep.create(talep);

    // 2) Companions
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await MisafirCompanions.create({
          misafirId: newTalep._id,
          adSoyad: c.adSoyad ?? null,
          tcPasaport: c.tcPasaport ?? null,
          telefon: c.telefon ?? null,
        });
        return saved._id;
      })
    );

    // 3) Routes
    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(newTalep._id, r))
    ).then((rs) => rs.map((r) => r._id));

    // 4) Notification (opsiyonel)
    let notificationId = null;
    if (notificationPerson) {
      const saved = await MisafirNotificationPerson.create({
        misafirId: newTalep._id,
        ...notificationPerson,
      });
      notificationId = saved._id;
    }

    // 5) finalize
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    newTalep.notificationPerson = notificationId;
    await newTalep.save();

    return res.status(201).json(newTalep);
  } catch (err) {
    console.error("❌ Misafir Talep Hatası:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", details: err.message });
  }
};

/* =============================================
   GET ALL  (GET /api/misafir-talep)
============================================= */
exports.getAllMisafirTalepleri = async (_req, res) => {
  try {
    const list = await MisafirTalep.find()
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson");
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

/* =============================================
   GET BY ID  (GET /api/misafir-talep/:id)
============================================= */
exports.getMisafirTalepById = async (req, res) => {
  try {
    const talep = await MisafirTalep.findById(req.params.id)
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .lean();

    if (!talep) return res.status(404).json({ error: "Talep bulunamadı." });

    // Bölge & Ülke adları (ek bilgi)
    const bolge = talep.bolge ? await Bolge.findById(talep.bolge).lean() : null;
    const country = talep.country
      ? await Ulke.findById(talep.country).populate("bolgeId", "ad").lean()
      : null;

    talep.bolgeName = bolge ? bolge.ad : "-";
    talep.countryName = country ? country.ad : "-";

    return res.json(talep);
  } catch (err) {
    return res.status(500).json({ error: "Sunucu hatası", details: err.message });
  }
};

/* =============================================
   UPDATE  (PUT /api/misafir-talep/:id)
============================================= */
exports.updateMisafirTalep = async (req, res) => {
  try {
    const id = req.params.id;

    const body = { ...req.body };
    delete body._token;
    delete body._method;

    const { talep, companions = [], routes = [], notificationPerson } = mapFromLaravel(body);

    // eski alt verileri temizle
    await Promise.all([
      MisafirCompanions.deleteMany({ misafirId: id }),
      MisafirRoutes.deleteMany({ misafirId: id }),
      MisafirNotificationPerson.deleteMany({ misafirId: id }),
    ]);

    // yeni companions
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await MisafirCompanions.create({
          misafirId: id,
          adSoyad: c.adSoyad ?? null,
          tcPasaport: c.tcPasaport ?? null,
          telefon: c.telefon ?? null,
        });
        return saved._id;
      })
    );

    // yeni routes
    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(id, r))
    ).then((rs) => rs.map((r) => r._id));

    // notification (opsiyonel)
    let notificationId = null;
    if (notificationPerson) {
      const saved = await MisafirNotificationPerson.create({
        misafirId: id,
        ...notificationPerson,
      });
      notificationId = saved._id;
    }

    const updated = await MisafirTalep.findByIdAndUpdate(
      id,
      { ...talep, companions: companionIds, routes: routeIds, notificationPerson: notificationId },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Talep bulunamadı." });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

/* =============================================
   DELETE  (DELETE /api/misafir-talep/:id)
============================================= */
exports.deleteMisafirTalep = async (req, res) => {
  try {
    const id = req.params.id;
    await Promise.all([
      MisafirCompanions.deleteMany({ misafirId: id }),
      MisafirRoutes.deleteMany({ misafirId: id }),
      MisafirNotificationPerson.deleteMany({ misafirId: id }),
      MisafirTalep.findByIdAndDelete(id),
    ]);
    return res.json({ message: "Talep ve ilişkili veriler silindi" });
  } catch (err) {
    return res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};
