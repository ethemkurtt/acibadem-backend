// controllers/talepler.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const {
  Types: { ObjectId },
} = require("mongoose");

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
    res.json(doc);
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

    const update = {
      atamaDurumu: "Evet",
      atamaYapanId,
      atamaYapanAdSoyad,
    };

    // --- Geriye dönük uyumlu alan okuma ---
    const norm = (v) => (typeof v === "string" ? v.trim() : v);
    const soforIn = norm(req.body.soforId ?? req.body.sofor ?? req.body.driverId);
    const aracIn  = norm(req.body.aracId  ?? req.body.arac  ?? req.body.vehicleId);
    const lokIn   = norm(req.body.lokasyonId ?? req.body.lokasyon ?? req.body.locationId);

    if (soforIn !== undefined) update.sofor = isId(soforIn) ? soforIn : null;
    if (aracIn  !== undefined) update.arac  = isId(aracIn)  ? aracIn  : null;
    if (lokIn   !== undefined) {
      update.lokasyon = isId(lokIn) ? lokIn : null;
      update.lokasyonSonDegistirenId = atamaYapanId || null;
    }

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

    return res.json({ message: "Atama başarılı", item });
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
exports.getFullById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id))
      return res.status(400).json({ ok: false, message: "Geçersiz id" });

    res.set("Cache-Control", "no-store");

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
      // HastaDetay şemanda `ref: "Companions" | "Routes" | "NotificationPerson"` ise,
      // populate otomatik doğru modelden doldurur.
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
        .populate([{ path: "companions" }])
        .lean();
    } else if (talep.requestType === "misafir") {
      // MisafirDetay şemanda ref'ler "MisafirCompanions" / "MisafirRoutes" / "MisafirNotificationPerson" ise
      // yine populate doğru modeli kullanır (preload ettik).
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
      // bilinmeyen tip
      detay = null;
    }

    // 3) DÖNÜŞ
    // Dün istediğin format: data altında { talep: {...}, detay: {...} }
    return res.json({
      ok: true,
      data: {
        talep, // okunabilir alanlar (lokasyon, talepEdenId vb. populate)
        detay: detay || null, // companions/routes/notificationPerson TAM OBJE (ID değil)
      },
    });
  } catch (err) {
    console.error("getFullById error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Internal Server Error" });
  }
};

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

    // (TARİH FİLTRESİ KALDIRILDI) => q.transferTarihi eklenmiyor

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
    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 }) // sıralama aynı kalsın
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
    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      // filters alanını istersen tamamen kaldırabilirsin; bırakırsak boş döndürelim
      filters: { startDate: null, endDate: null },
    });
  } catch (err) {
    console.error("❌ aracTalep listesi alınamadı:", err);
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
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

    // Zorunlu filtre: sadece ataması yapılmamış olanlar
    q.atamaDurumu = "Evet";

    // (TARİH FİLTRESİ KALDIRILDI) => q.transferTarihi eklenmiyor

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
    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 }) // sıralama aynı kalsın
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
    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
      // filters alanını istersen tamamen kaldırabilirsin; bırakırsak boş döndürelim
      filters: { startDate: null, endDate: null },
    });
  } catch (err) {
    console.error("❌ aracTalep listesi alınamadı:", err);
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
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
          { path: "routes" },
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
      sofor: meId,            // şoför benim olmalı
      atamaDurumu: "Evet",    // ataması yapılmış olmalı
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
    const { page = 1, limit = 20 } = req.query;

    // Giriş yapan kullanıcı ID’si (JWT middleware’den geliyor)
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
      atamaYapanId: meId,     // benim atadığım işler
      atamaDurumu: "Evet",    // gerçekten ataması yapılmış olanlar
    };

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

    // Cevap
    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (err) {
    console.error("❌ myIsAtamalarim hata:", err);
    return res.status(500).json({
      message: "Atadığın işler listelenemedi.",
      error: err.message,
    });
  }
};