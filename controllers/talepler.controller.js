// controllers/talepler.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const {
  Types: { ObjectId },
} = require("mongoose");
const Hastane = require("../models/hastane/hastane.model.js");
const Otel = require("../models/otel/otel.model.js");
const Havalimani = require("../models/havalimanı/havalimani.model.js");
// Tip-özel detay modelleri
const HastaDetay = require("../models/talepler/hastaTalepDetay.model");
const PersonelDetay = require("../models/talepler/personelTalepDetay.model");
const MisafirDetay = require("../models/talepler/misafirTalepDetay.model");
const DigerDetay = require("../models/talepler/digerTalepDetay.model");

// ------------------ Güvenli preload (farklı klasör/adlarla kayıtlı olabilir) ------------------
const safeRequire = (p) => {
  try {
    return require(p);
  } catch {
    return null;
  }
};

// HASTA/PERSONEL ortakları
safeRequire("../models/hastaTalepModels/companions.model");
safeRequire("../models/hastaTalepModels/routes.model");
safeRequire("../models/hastaTalepModels/notificationPerson.model");

// MİSAFİR'e özel
safeRequire("../models/misafirTalepModels/companions.model");
safeRequire("../models/misafirTalepModels/routes.model");
safeRequire("../models/misafirTalepModels/notificationPerson.model");

// ---------------------------------------------------------------------------------------------

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// Ortak: User populate'larında hassas alanları gizle
const userSelectExclude =
  "-password -resetPasswordToken -resetPasswordExpires -__v";

// ---------------------- CRUD (değiştirmeden, ufak temizliklerle) ----------------------

const getLocModelAndNameField = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "otel") {
    return {
      Model: require("../models/otel/otel.model.js"),
      nameField: "otelAdi",
    };
  }
  if (t === "hastane") {
    return {
      Model: require("../models/hastane/hastane.model"),
      // şemana göre güncelle
      nameField: "hastaneAdi",
    };
  }
  if (t === "havaalani" || t === "havalimani") {
    return {
      Model: require("../models/havalimanı/havalimani.model.js"),
      // şemana göre güncelle
      nameField: "havalimaniAdi",
    };
  }
  return { Model: null, nameField: null };
};

const addKordinatToOne = async (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (!obj.type || !obj.locationId) return obj;

  const { Model, nameField } = getLocModelAndNameField(obj.type);
  if (!Model) return obj;

  const selectFields = ["kordinat"];
  if (nameField) selectFields.push(nameField);

  const doc = await Model.findById(obj.locationId)
    .select(selectFields.join(" "))
    .lean()
    .catch(() => null);

  const out = { ...obj };
  out.kordinat = doc?.kordinat ?? obj.kordinat ?? null;

  // locationName boşsa, tip-özel ad alanından doldur
  if (!out.locationName && doc && nameField && doc[nameField]) {
    out.locationName = doc[nameField];
  }
  return out;
};

const addKordinatFlexible = async (val) => {
  if (Array.isArray(val)) {
    return await Promise.all(val.map(addKordinatToOne));
  }
  return await addKordinatToOne(val);
};
/* ------------------------------------------------------------------------------------- */

exports.aracTalep = async (req, res) => {
  try {
    const { requestType, sofor, lokasyon, page = 1, limit = 20 } = req.query;

    // ---- Kullanıcının lokasyonlarını topla ----
    const user = req.user || {};
    let userLokasyonIds = [];

    if (req.lokasyonId) {
      userLokasyonIds.push(new ObjectId(req.lokasyonId.toString()));
    }
    if (Array.isArray(user.lokasyonlar) && user.lokasyonlar.length) {
      userLokasyonIds.push(
        ...user.lokasyonlar
          .filter(Boolean)
          .map((l) => new ObjectId(l.toString()))
      );
    }
    if (user.lokasyon) {
      userLokasyonIds.push(new ObjectId(user.lokasyon.toString()));
    }

    // Duplicate temizle
    userLokasyonIds = [
      ...new Set(userLokasyonIds.map((id) => id.toString())),
    ].map((id) => new ObjectId(id));

    if (!userLokasyonIds.length) {
      return res
        .status(400)
        .json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    // ---- Ana filtre nesnesi ----
    const q = {};
    // Zorunlu filtre: sadece ataması yapılmamış olanlar
    q.atamaDurumu = "Hayır";
    // Tamamlanmış işler gelmesin
    q.isDurumu = { $ne: "Tamamlandı" };

    // Diğer filtreler:
    if (requestType) q.requestType = requestType;
    if (sofor && isId(sofor)) q.sofor = sofor;

    // Lokasyon filtresi: kullanıcının yetkili olduğu lokasyonlarla kesiştir
    if (lokasyon && isId(lokasyon)) {
      const lokId = new ObjectId(lokasyon);
      const isAllowed = userLokasyonIds.some((u) => u.equals(lokId));
      q.lokasyon = isAllowed ? lokId : new ObjectId("000000000000000000000000"); // yetkisizse boş döner
    } else {
      q.lokasyon = { $in: userLokasyonIds };
    }

    // ⚠️ Filtreleme/sıralama route tarihlerine göre yapılacağı için,
    // önce tüm adayları çekiyoruz; sonra bellekte filtreleyip sıralayacağız.
    const rawItems = await Talepler.find(q)
      .sort({ createdAt: -1 }) // geçici; gerçek sıralamayı aşağıda yapacağız
      .populate([
        { path: "lokasyon" },
        { path: "sofor", select: userSelectExclude },
        { path: "arac" },
        { path: "talepEdenId", select: userSelectExclude },
        { path: "atamaYapanId", select: userSelectExclude },
        { path: "lokasyonSonDegistirenId", select: userSelectExclude },
      ])
      .lean();

    // ---- Detayları toplu halde çek (N+1 yerine batched) ----
    const idsByType = { hasta: [], personel: [], misafir: [], diger: [] };

    for (const t of rawItems) {
      const id = t?._id?.toString();
      if (!id) continue;
      const rt = (t.requestType || "").toLowerCase();
      if (idsByType[rt]) idsByType[rt].push(id);
    }

    const POPULATE_HASTA_MISAFIR = [
      { path: "companions" },
      { path: "routes" },
      { path: "notificationPerson" },
      { path: "bolge" },
      { path: "country" },
    ];
    const POPULATE_PERSONEL = [{ path: "companions" }, { path: "routes" }];

    const [
      hastaDetayList,
      personelDetayList,
      misafirDetayList,
      digerDetayList,
    ] = await Promise.all([
      idsByType.hasta.length
        ? HastaDetay.find({ talep_id: { $in: idsByType.hasta } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.personel.length
        ? PersonelDetay.find({ talep_id: { $in: idsByType.personel } })
            .populate(POPULATE_PERSONEL)
            .lean()
        : [],
      idsByType.misafir.length
        ? MisafirDetay.find({ talep_id: { $in: idsByType.misafir } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.diger.length
        ? DigerDetay.find({ talep_id: { $in: idsByType.diger } }).lean()
        : [],
    ]);

    const detayMap = new Map();
    for (const d of hastaDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of personelDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of misafirDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of digerDetayList) detayMap.set(String(d.talep_id), d);

    // Yardımcılar: tarih çıkarımı
    const normDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d) ? null : d;
    };
    const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
    const IST_TODAY_START = (() => {
      const now = new Date();
      // Sunucu TZ'sini kullanıyoruz; ihtiyaca göre Europe/Istanbul’a sabitlenebilir.
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    })();

    // routes içinden başlangıç(ilk pickup) ve bitiş(son drop) hesapla + kordinat backfill
    const needsCoord = new Set(["hasta", "misafir", "personel"]);
    const computed = []; // { item, detay, start, end }

    for (const t of rawItems) {
      const rt = (t.requestType || "").toLowerCase();
      const d = detayMap.get(String(t._id)) || null;

      // default: transferTarihi yedeği
      let start = null;
      let end = null;

      if (d && Array.isArray(d.routes) && d.routes.length) {
        // koordinat & name backfill ve min/max tarih çıkarımı
        const processedRoutes = await Promise.all(
          d.routes.map(async (r) => {
            const base = r?.toObject ? r.toObject() : r;
            const out = { ...base };

            // backfill (opsiyonel)
            if (needsCoord.has(rt)) {
              out.pickup = await addKordinatFlexible(base.pickup);
              out.drop = await addKordinatFlexible(base.drop);
            }

            // tarih çıkarımı
            const pickupArr = toArray(out.pickup);
            const dropArr = toArray(out.drop);

            const pickupDates = pickupArr
              .map((p) => normDate(p?.date))
              .filter(Boolean);
            const dropDates = dropArr
              .map((p) => normDate(p?.date))
              .filter(Boolean);

            const localMinPickup =
              pickupDates.length ? new Date(Math.min(...pickupDates)) : null;
            const localMaxDrop = dropDates.length
              ? new Date(Math.max(...dropDates))
              : pickupDates.length
              ? new Date(Math.max(...pickupDates))
              : null;

            if (localMinPickup && (!start || localMinPickup < start)) {
              start = localMinPickup;
            }
            if (localMaxDrop && (!end || localMaxDrop > end)) {
              end = localMaxDrop;
            }

            return out;
          })
        );

        // detay.routes'i geri yaz
        if (processedRoutes.length) {
          d.routes = processedRoutes;
        }
      }

      // Yedek: routes yoksa transferTarihi’ni dene
      if (!start) start = normDate(t.transferTarihi);
      if (!end) end = normDate(t.transferTarihi);

      computed.push({ item: t, detay: d, start, end });
    }

    // --- Filtre kuralları ---
    // 1) Tamamlanmışlar zaten q.isDurumu ile elendi
    // 2) Bitiş tarihi < bugün 00:00 ise gösterme (tamamen geçmiş)
    const filtered = computed.filter(({ end }) => {
      if (!end) return false; // tarih yoksa listeleme
      return end >= IST_TODAY_START;
    });

    // --- Sıralama: başlangıç (min pickup) eskiden → yeniye ---
    filtered.sort((a, b) => {
      const ax = a.start ? a.start.getTime() : Number.MAX_SAFE_INTEGER;
      const bx = b.start ? b.start.getTime() : Number.MAX_SAFE_INTEGER;
      if (ax !== bx) return ax - bx;
      // eşitlikte createdAt ile bağla
      const ac = a.item.createdAt ? new Date(a.item.createdAt).getTime() : 0;
      const bc = b.item.createdAt ? new Date(b.item.createdAt).getTime() : 0;
      return bc - ac;
    });

    // --- Sayfalama (filtre + sıralamadan sonra) ---
    const total = filtered.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paged = filtered.slice(skip, skip + Number(limit));

    // Yanıt: item + detay (eski şemayla uyumlu)
    const items = paged.map(({ item, detay }) => ({ ...item, detay }));

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      filters: {
        startDate: IST_TODAY_START.toISOString(),
        endDate: null, // kural: "bitiş >= bugün", üst sınır yok
      },
    });
  } catch (err) {
    console.error("❌ aracTalep listesi alınamadı:", err);
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};


exports.create = async (req, res) => {
  try {
    const body = req.body || {};

    // Eğer atamaDurumu yoksa veya null ise "Hayır" olarak ayarla
    if (body.atamaDurumu == null) {
      body.atamaDurumu = "Hayır";
    }

    const doc = await Talepler.create(body);
    res.status(201).json(doc);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Talep oluşturulamadı", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const {
      requestType,
      sofor,
      lokasyon,
      atamaDurumu,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const q = {};

    // Filtreler
    if (requestType) q.requestType = requestType;
    if (atamaDurumu) q.atamaDurumu = atamaDurumu;
    if (sofor && isId(sofor)) q.sofor = sofor;
    if (lokasyon && isId(lokasyon)) q.lokasyon = lokasyon;

    // 🔹 Tarih aralığı filtreleme (transferTarihi üzerinden)
    if (startDate || endDate) {
      const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
      const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

      q.transferTarihi = {};
      if (start) q.transferTarihi.$gte = start;
      if (end) q.transferTarihi.$lte = end;
    }

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);

    // Sorgu + toplam sayımı
    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate([
          { path: "lokasyon" },
          { path: "sofor", select: userSelectExclude },
          { path: "arac" },
          { path: "talepEdenId", select: userSelectExclude },
          { path: "atamaYapanId", select: userSelectExclude },
          { path: "lokasyonSonDegistirenId", select: userSelectExclude },
        ]),
      Talepler.countDocuments(q),
    ]);

    // Yanıt
    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      filters: { startDate, endDate },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const doc = await Talepler.findById(id).populate([
      { path: "lokasyon" },
      { path: "sofor", select: userSelectExclude },
      { path: "arac" },
      { path: "talepEdenId", select: userSelectExclude },
      { path: "atamaYapanId", select: userSelectExclude },
      { path: "lokasyonSonDegistirenId", select: userSelectExclude },
    ]);

    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });

    // --- SADECE ISTENEN IF BLOĞU ---
    // (addKordinatToRoutes, fetchKordinat/getModel yardımcılarını yukarıda eklemiştin)
    let result = doc.toObject();
    if (doc.requestType === "hasta" || doc.requestType === "misafir") {
      const DetayModel =
        doc.requestType === "hasta" ? HastaDetay : MisafirDetay;
      const d = await DetayModel.findOne({ talep_id: id })
        .populate([{ path: "routes" }])
        .lean();

      if (d?.routes?.length) {
        result.routes = await addKordinatToRoutes(d.routes); // pickup/drop içine sadece kordinat string’i ekler
      }
    }
    // --- /IF ---

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Talep getirilemedi", error: err.message });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const updated = await Talepler.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Talep güncellenemedi", error: err.message });
  }
};

exports.assignAracSofor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) {
      return res.status(400).json({ error: "Geçersiz talep id" });
    }

    const atamaYapanId = req.user?._id || req.userId || null;
    const atamaYapanAdSoyad = req.user?.fullName || req.user?.name || "";

    // --- Geriye dönük uyumlu alan okuma ---
    const norm = (v) => (typeof v === "string" ? v.trim() : v);
    const soforIn = norm(req.body.soforId ?? req.body.sofor ?? req.body.driverId);
    const aracIn  = norm(req.body.aracId  ?? req.body.arac  ?? req.body.vehicleId);
    const lokIn   = norm(req.body.lokasyonId ?? req.body.lokasyon ?? req.body.locationId);

    const soforProvided = soforIn !== undefined;
    const aracProvided  = aracIn  !== undefined;
    const lokProvided   = lokIn   !== undefined;

    const soforValid = soforProvided && isId(soforIn);
    const aracValid  = aracProvided  && isId(aracIn);
    const lokValid   = lokProvided   && isId(lokIn);

    const update = {
      atamaYapanId,
      atamaYapanAdSoyad,
    };

    if (soforProvided) update.sofor = soforValid ? soforIn : null;
    if (aracProvided)  update.arac  = aracValid  ? aracIn  : null;
    if (lokProvided) {
      update.lokasyon = lokValid ? lokIn : null;
      update.lokasyonSonDegistirenId = atamaYapanId || null;
    }

    // ── Atama durumu mantığı ─────────────────────────────────────────────
    if (soforValid && aracValid) {
      // Şoför + araç geçerli -> Evet
      update.atamaDurumu = "Evet";
    } else if (!soforProvided && !aracProvided && lokProvided) {
      // Sadece lokasyon gönderilmiş -> Hayır
      update.atamaDurumu = "Hayır";
    }
    // Diğer durumlarda atamaDurumu'na dokunma (mevcut değer korunur)
    // ────────────────────────────────────────────────────────────────────

    const item = await Talepler.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate([{ path: "lokasyon" }, { path: "arac" }])
      .populate({ path: "sofor", select: userSelectExclude })
      .populate({ path: "talepEdenId", select: userSelectExclude })
      .populate({ path: "atamaYapanId", select: userSelectExclude })
      .populate({ path: "lokasyonSonDegistirenId", select: userSelectExclude });

    if (!item) return res.status(404).json({ error: "Talep bulunamadı" });

    return res.json({ message: "Güncelleme başarılı", item });
  } catch (err) {
    console.error("❌ assignAracSofor hata:", err);
    return res.status(500).json({ error: "Atama yapılamadı", details: err.message });
  }
};
exports.updateUetdsSeferReferansNo = async (req, res) => {
  try {
    const { id } = req.params;
    const { uetdsSeferReferansNo } = req.body;

    const item = await Talepler.findByIdAndUpdate(
      id,
      { uetdsSeferReferansNo },
      { new: true }
    );

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: "Güncelleme yapılamadı" });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const deleted = await Talepler.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json({ message: "Silindi", id });
  } catch (err) {
    res.status(500).json({ message: "Talep silinemedi", error: err.message });
  }
};

// ---------------------- FULL DETAIL ----------------------
const getLocModel = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "hastane") return Hastane;
  if (t === "otel") return Otel;
  if (t === "havaalani" || t === "havalimani") return Havalimani;
  return null;
};

exports.getFullById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id))
      return res.status(400).json({ ok: false, message: "Geçersiz id" });

    res.set("Cache-Control", "no-store");

    // --- İç yardımcılar (self-contained) ---
    const getLocModel = (type) => {
      const t = String(type || "").toLowerCase();
      if (t === "hastane") return require("../models/hastane/hastane.model");
      if (t === "otel") return require("../models/otel/otel.model.js");
      if (t === "havaalani" || t === "havalimani")
        return require("../models/havalimanı/havalimani.model.js");
      return null;
    };

    const addKordinatToOne = async (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      if (!obj.type || !obj.locationId) return obj;

      const M = getLocModel(obj.type);
      if (!M) return obj;

      const doc = await M.findById(obj.locationId)
        .select("kordinat")
        .lean()
        .catch(() => null);

      // NESNEYİ KORU + sadece kordinat alanını ekle
      return { ...obj, kordinat: doc?.kordinat ?? null };
    };

    const addKordinatFlexible = async (val) => {
      if (Array.isArray(val)) {
        const updated = await Promise.all(val.map(addKordinatToOne));
        return updated;
      }
      return await addKordinatToOne(val);
    };
    // ---------------------------------------

    // 1) Ana talep — okunabilir (populate)
    const talep = await Talepler.findById(id)
      .populate([
        { path: "lokasyon" },
        { path: "arac" },
        { path: "sofor", select: userSelectExclude },
        { path: "talepEdenId", select: userSelectExclude },
        { path: "atamaYapanId", select: userSelectExclude },
        { path: "lokasyonSonDegistirenId", select: userSelectExclude },
      ])
      .lean();

    if (!talep)
      return res.status(404).json({ ok: false, message: "Talep bulunamadı" });

    let detay = null;

    // 2) Tip-özel detay + referanslar (companions/routes/notificationPerson) TAM OBJE
    if (talep.requestType === "hasta") {
      detay = await HastaDetay.findOne({ talep_id: id })
        .populate([
          { path: "companions" },
          { path: "routes" },
          { path: "notificationPerson" },
          { path: "bolge" },
          { path: "country" },
        ])
        .lean();
    } else if (talep.requestType === "personel") {
      detay = await PersonelDetay.findOne({ talep_id: id })
        .populate([{ path: "companions" }, { path: "routes" }])
        .lean();
    } else if (talep.requestType === "misafir") {
      detay = await MisafirDetay.findOne({ talep_id: id })
        .populate([
          { path: "companions" },
          { path: "routes" },
          { path: "notificationPerson" },
          { path: "bolge" },
          { path: "country" },
        ])
        .lean();
    } else if (talep.requestType === "diger") {
      detay = await DigerDetay.findOne({ talep_id: id }).lean();
    } else {
      detay = null;
    }

    // 3) hasta/misafir için: pickup/drop İÇİNE kordinat ekle (pickup/drop dizi olursa her elemana eklenir)
    if (
      (talep.requestType === "hasta" || talep.requestType === "misafir") &&
      detay?.routes?.length
    ) {
      detay.routes = await Promise.all(
        detay.routes.map(async (r) => {
          const base = r?.toObject ? r.toObject() : r;
          const out = { ...base };

          out.pickup = await addKordinatFlexible(base.pickup);
          out.drop = await addKordinatFlexible(base.drop);

          return out;
        })
      );
    }

    // 4) DÖNÜŞ
    return res.json({
      ok: true,
      data: {
        talep,
        detay: detay || null,
      },
    });
  } catch (err) {
    console.error("getFullById error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Internal Server Error" });
  }
};

exports.aracIsEmri = async (req, res) => {
  try {
    const { requestType, sofor, lokasyon, page = 1, limit = 20 } = req.query;

    // ---- Kullanıcının lokasyonlarını topla ----
    const user = req.user || {};
    let userLokasyonIds = [];

    if (req.lokasyonId) {
      userLokasyonIds.push(new ObjectId(req.lokasyonId.toString()));
    }
    if (Array.isArray(user.lokasyonlar) && user.lokasyonlar.length) {
      userLokasyonIds.push(
        ...user.lokasyonlar
          .filter(Boolean)
          .map((l) => new ObjectId(l.toString()))
      );
    }
    if (user.lokasyon) {
      userLokasyonIds.push(new ObjectId(user.lokasyon.toString()));
    }

    // Duplicate temizle
    userLokasyonIds = [
      ...new Set(userLokasyonIds.map((id) => id.toString())),
    ].map((id) => new ObjectId(id));

    if (!userLokasyonIds.length) {
      return res
        .status(400)
        .json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    // ---- Ana filtre nesnesi ----
    const q = {};
    q.atamaDurumu = "Evet"; // iş emri olanlar

    if (requestType) q.requestType = requestType;
    if (sofor && isId(sofor)) q.sofor = sofor;

    // Lokasyon filtresi
    if (lokasyon && isId(lokasyon)) {
      const lokId = new ObjectId(lokasyon);
      const isAllowed = userLokasyonIds.some((u) => u.equals(lokId));
      q.lokasyon = isAllowed ? lokId : new ObjectId("000000000000000000000000");
    } else {
      q.lokasyon = { $in: userLokasyonIds };
    }

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);

    // Sorgu + toplam sayım
    const [rawItems, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate([
          { path: "lokasyon" },
          { path: "sofor", select: userSelectExclude },
          { path: "arac" },
          { path: "talepEdenId", select: userSelectExclude },
          { path: "atamaYapanId", select: userSelectExclude },
          { path: "lokasyonSonDegistirenId", select: userSelectExclude },
        ])
        .lean(),
      Talepler.countDocuments(q),
    ]);

    // ---- Detaylar (hasta/personel/misafir/diger) ----
    const idsByType = { hasta: [], personel: [], misafir: [], diger: [] };
    for (const t of rawItems) {
      const id = t?._id?.toString();
      if (!id) continue;
      const rt = (t.requestType || "").toLowerCase();
      if (idsByType[rt]) idsByType[rt].push(id);
    }

    const POPULATE_HASTA_MISAFIR = [
      { path: "companions" },
      { path: "routes" },
      { path: "notificationPerson" },
      { path: "bolge" },
      { path: "country" },
    ];
    const POPULATE_PERSONEL = [{ path: "companions" }];

    const [
      hastaDetayList,
      personelDetayList,
      misafirDetayList,
      digerDetayList,
    ] = await Promise.all([
      idsByType.hasta.length
        ? HastaDetay.find({ talep_id: { $in: idsByType.hasta } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.personel.length
        ? PersonelDetay.find({ talep_id: { $in: idsByType.personel } })
            .populate(POPULATE_PERSONEL)
            .lean()
        : [],
      idsByType.misafir.length
        ? MisafirDetay.find({ talep_id: { $in: idsByType.misafir } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.diger.length
        ? DigerDetay.find({ talep_id: { $in: idsByType.diger } }).lean()
        : [],
    ]);

    // Map oluştur
    const detayMap = new Map();
    for (const d of hastaDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of personelDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of misafirDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of digerDetayList) detayMap.set(String(d.talep_id), d);

    // Hasta/Misafir için kordinat + locationName
    const needsCoord = new Set(["hasta", "misafir"]);
    for (const t of rawItems) {
      const rt = (t.requestType || "").toLowerCase();
      const d = detayMap.get(String(t._id));
      if (!d) continue;

      if (needsCoord.has(rt) && Array.isArray(d.routes) && d.routes.length) {
        d.routes = await Promise.all(
          d.routes.map(async (r) => {
            const base = r?.toObject ? r.toObject() : r;
            const out = { ...base };
            out.pickup = await addKordinatFlexible(base.pickup);
            out.drop = await addKordinatFlexible(base.drop);
            return out;
          })
        );
      }
    }

    // Nihai dönüş (detaylı JSON)
    const items = rawItems.map((t) => {
      const detay = detayMap.get(String(t._id)) || null;
      let nereden = "-",
        nereye = "-",
        kisiSayisi = "-",
        tarihSaat = "-";

      if (detay?.routes?.length) {
        const r = detay.routes[0];
        nereden = r?.pickup?.locationName || "-";
        nereye = r?.drop?.locationName || "-";
        kisiSayisi = r?.pickup?.person || r?.drop?.person || "-";
        const date = r?.pickup?.date || r?.drop?.date;
        tarihSaat = date ? new Date(date).toLocaleString("tr-TR") : "-";
      }

      return {
        ...t,
        detay,
        nereden,
        nereye,
        kisiSayisi,
        tarihSaat,
      };
    });

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      filters: { startDate: null, endDate: null },
    });
  } catch (err) {
    console.error("❌ aracIsEmri listesi alınamadı:", err);
    res
      .status(500)
      .json({ message: "İş emirleri listelenemedi", error: err.message });
  }
};

exports.taleplerim = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Giriş yapan kullanıcı id'si (JWT middleware'den)
    const userIdRaw = req.user?._id || req.userId;
    if (!userIdRaw) {
      return res.status(401).json({ error: "Kullanıcı doğrulanamadı." });
    }
    const talepEdenId = ObjectId.isValid(userIdRaw)
      ? new ObjectId(userIdRaw)
      : userIdRaw;

    // YEGANE filtre: sadece kendi oluşturdukları
    const q = { talepEdenId };

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);

    // Sorgu + toplam
    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate([
          { path: "lokasyon" },
          { path: "sofor", select: userSelectExclude },
          { path: "arac" },
          { path: "talepEdenId", select: userSelectExclude },
          { path: "atamaYapanId", select: userSelectExclude },
          { path: "lokasyonSonDegistirenId", select: userSelectExclude },
        ]),
      Talepler.countDocuments(q),
    ]);

    // Yanıt şeması aynı
    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (err) {
    console.error("❌ aracIsEmri listesi alınamadı:", err);
    return res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};

exports.islerim = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Giriş yapan kullanıcı ID'si zorunlu
    const userIdRaw = req.user?._id || req.userId;
    if (!userIdRaw) {
      return res.status(401).json({ error: "Kullanıcı doğrulanamadı." });
    }
    if (!ObjectId.isValid(String(userIdRaw))) {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID" });
    }
    const meId = new ObjectId(String(userIdRaw));

    // --- FİLTRE ---
    const q = {
      sofor: meId, // şoför benim olmalı
      atamaDurumu: "Evet", // ataması yapılmış olmalı
    };

    // Debug yardımcı
    console.log("isAtamalarim filtre:", JSON.stringify(q));

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);

    // Sorgu + toplam
    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate([
          { path: "lokasyon" },
          { path: "sofor", select: userSelectExclude },
          { path: "arac" },
          { path: "talepEdenId", select: userSelectExclude },
          { path: "atamaYapanId", select: userSelectExclude },
          { path: "lokasyonSonDegistirenId", select: userSelectExclude },
        ]),
      Talepler.countDocuments(q),
    ]);

    // Yanıt şeması
    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (err) {
    console.error("❌ isAtamalarim listesi alınamadı:", err);
    return res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};

exports.isAtamalarim = async (req, res) => {
  try {
    const { requestType, sofor, lokasyon, page = 1, limit = 20 } = req.query;

    // ---- Kullanıcının lokasyonlarını topla ----
    const user = req.user || {};
    let userLokasyonIds = [];

    if (req.lokasyonId) {
      userLokasyonIds.push(new ObjectId(req.lokasyonId.toString()));
    }
    if (Array.isArray(user.lokasyonlar) && user.lokasyonlar.length) {
      userLokasyonIds.push(
        ...user.lokasyonlar
          .filter(Boolean)
          .map((l) => new ObjectId(l.toString()))
      );
    }
    if (user.lokasyon) {
      userLokasyonIds.push(new ObjectId(user.lokasyon.toString()));
    }

    // Duplicate temizle
    userLokasyonIds = [
      ...new Set(userLokasyonIds.map((id) => id.toString())),
    ].map((id) => new ObjectId(id));

    if (!userLokasyonIds.length) {
      return res
        .status(400)
        .json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    // ---- Ana filtre nesnesi ----
    const q = {};
    // Zorunlu filtre: sadece ataması yapılmamış olanlar
    q.atamaDurumu = "Evet";

    // Diğer filtreler:
    if (requestType) q.requestType = requestType;
    if (sofor && isId(sofor)) q.sofor = sofor;

    // Lokasyon filtresi: kullanıcının yetkili olduğu lokasyonlarla kesiştir
    if (lokasyon && isId(lokasyon)) {
      const lokId = new ObjectId(lokasyon);
      const isAllowed = userLokasyonIds.some((u) => u.equals(lokId));
      q.lokasyon = isAllowed ? lokId : new ObjectId("000000000000000000000000"); // yetkisizse boş döner
    } else {
      q.lokasyon = { $in: userLokasyonIds };
    }

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);

    // Sorgu + toplam sayım
    const [rawItems, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate([
          { path: "lokasyon" },
          { path: "sofor", select: userSelectExclude },
          { path: "arac" },
          { path: "talepEdenId", select: userSelectExclude },
          { path: "atamaYapanId", select: userSelectExclude },
          { path: "lokasyonSonDegistirenId", select: userSelectExclude },
        ])
        .lean(),
      Talepler.countDocuments(q),
    ]);

    // ---- Detayları toplu halde çek (N+1 yerine batched) ----
    const idsByType = { hasta: [], personel: [], misafir: [], diger: [] };

    for (const t of rawItems) {
      const id = t?._id?.toString();
      if (!id) continue;
      const rt = (t.requestType || "").toLowerCase();
      if (idsByType[rt]) idsByType[rt].push(id);
    }

    const POPULATE_HASTA_MISAFIR = [
      { path: "companions" },
      { path: "routes" },
      { path: "notificationPerson" },
      { path: "bolge" },
      { path: "country" },
    ];
    const POPULATE_PERSONEL = [{ path: "companions" }];

    const [
      hastaDetayList,
      personelDetayList,
      misafirDetayList,
      digerDetayList,
    ] = await Promise.all([
      idsByType.hasta.length
        ? HastaDetay.find({ talep_id: { $in: idsByType.hasta } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.personel.length
        ? PersonelDetay.find({ talep_id: { $in: idsByType.personel } })
            .populate(POPULATE_PERSONEL)
            .lean()
        : [],
      idsByType.misafir.length
        ? MisafirDetay.find({ talep_id: { $in: idsByType.misafir } })
            .populate(POPULATE_HASTA_MISAFIR)
            .lean()
        : [],
      idsByType.diger.length
        ? DigerDetay.find({ talep_id: { $in: idsByType.diger } }).lean()
        : [],
    ]);

    // talep_id -> detay map
    const detayMap = new Map();
    for (const d of hastaDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of personelDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of misafirDetayList) detayMap.set(String(d.talep_id), d);
    for (const d of digerDetayList) detayMap.set(String(d.talep_id), d);

    // Hasta/Misafir için routes.pickup/drop içine kordinat + locationName backfill
    const needsCoord = new Set(["hasta", "misafir"]);
    for (const t of rawItems) {
      const rt = (t.requestType || "").toLowerCase();
      const d = detayMap.get(String(t._id));
      if (!d) continue;

      if (needsCoord.has(rt) && Array.isArray(d.routes) && d.routes.length) {
        d.routes = await Promise.all(
          d.routes.map(async (r) => {
            const base = r?.toObject ? r.toObject() : r;
            const out = { ...base };
            out.pickup = await addKordinatFlexible(base.pickup);
            out.drop = await addKordinatFlexible(base.drop);
            return out;
          })
        );
      }
    }

    // Son liste: item + detay
    const items = rawItems.map((t) => {
      const d = detayMap.get(String(t._id)) || null;
      return { ...t, detay: d };
    });

    // Yanıt (şema aynı, sadece her item’da `detay` var)
    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      filters: { startDate: null, endDate: null },
    });
  } catch (err) {
    console.error("❌ aracTalep listesi alınamadı:", err);
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};
