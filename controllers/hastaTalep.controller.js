const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const HastaTalep = require("../models/hastaTalepModels/hastaTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");
const Routes = require("../models/hastaTalepModels/routes.model");
const Bolge = require("../models/bolge.model");
const Ulke = require("../models/ulke.model");

// ─────────────────────────────────────────────────────────────────────────────
// 📌 Dosya kaydetme yardımcı (şu an string path geldiği için kullanılmıyor)
// ─────────────────────────────────────────────────────────────────────────────
const saveFileInfo = (file, folder) => {
  if (!file) return null;
  const uploadPath = `/uploads/${folder}/${Date.now()}-${file.originalname}`;
  const targetPath = path.join(__dirname, "../../public", uploadPath);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.renameSync(file.path, targetPath);

  return { fileName: file.originalname, filePath: uploadPath };
};

// ─────────────────────────────────────────────────────────────────────────────
// 📌 Tek route kaydı
// ─────────────────────────────────────────────────────────────────────────────
const createRouteRecord = async (hastaId, routeData) => {
  const processSide = async (side) => {
    if (!routeData[side]) return null;

    const sideData = { ...routeData[side] };

    if (!sideData.locationId || sideData.locationId === "") {
      delete sideData.locationId;
    }

    if (routeData[side].ticket && routeData[side].ticket !== "") {
      sideData.ticket = routeData[side].ticket;
    } else {
      delete sideData.ticket;
    }

    if (Array.isArray(routeData[side].passport) && routeData[side].passport.length) {
      sideData.passport = routeData[side].passport.join(", ");
    } else if (routeData[side].passport && routeData[side].passport !== "") {
      sideData.passport = routeData[side].passport;
    } else {
      delete sideData.passport;
    }

    return sideData;
  };

  return await Routes.create({
    hastaId,
    pickup: await processSide("pickup"),
    drop: await processSide("drop"),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * ✅ POST - Yeni Talep Oluştur
 */
// ─────────────────────────────────────────────────────────────────────────────
exports.createHastaTalep = async (req, res) => {
  try {
    const {
      companions = [],
      routes = [],
      notificationPerson,
      talepEdenId: bodyUserId,
      talepEdenAdSoyad: bodyUserName,
      ...talepData
    } = req.body;

    // 1) Talebi oluşturan kullanıcı (BODY → header → req.user)
    const headerUserId   = req.get?.("x-user-id");
    const headerUserName = req.get?.("x-user-name");

    let talepEdenId = (typeof bodyUserId !== "undefined" ? bodyUserId : null)
                   || headerUserId
                   || (req.user && (req.user._id || req.user.id))
                   || req.userId;

    let talepEdenAdSoyad = (typeof bodyUserName !== "undefined" ? bodyUserName : null)
                        || headerUserName
                        || (req.user && (req.user.fullName || req.user.name));

    if (typeof talepEdenId === "string") talepEdenId = talepEdenId.trim();
    if (typeof talepEdenAdSoyad === "string") talepEdenAdSoyad = talepEdenAdSoyad.trim();

    if (!talepEdenId || !talepEdenAdSoyad) {
      return res.status(400).json({ error: "Talebi oluşturan kullanıcı bilgisi eksik (talepEdenId / talepEdenAdSoyad)." });
    }

    if (!mongoose.Types.ObjectId.isValid(talepEdenId)) {
      return res.status(400).json({ error: "talepEdenId geçerli bir ObjectId değil." });
    }

    // 2) transferTarihi & transferTipi türet
    let transferTarihi = talepData.transferTarihi;
    let transferTipi = talepData.transferTipi;

    if ((!transferTarihi || !transferTipi) && Array.isArray(routes) && routes.length > 0) {
      const firstPickup = routes.find(r => r?.pickup?.date)?.pickup;

      if (!transferTarihi) {
        if (!firstPickup?.date) {
          return res.status(400).json({ error: "transferTarihi eksik: en az bir güzergah için pickup tarih/saat seçilmelidir." });
        }
        const dt = new Date(firstPickup.date);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({ error: "transferTarihi geçerli bir tarih olmalı." });
        }
        transferTarihi = dt;
      }

      if (!transferTipi) {
        const firstRoute = routes[0] || {};
        const pickupType = firstRoute?.pickup?.type;
        const dropType = firstRoute?.drop?.type;
        if (pickupType === "havalimani") transferTipi = "Havalimanı Geliş";
        else if (dropType === "havalimani") transferTipi = "Havalimanı Dönüş";
        else transferTipi = "Normal";
      }
    }

    const ALLOWED_TIPLER = ["Normal", "Havalimanı Geliş", "Havalimanı Dönüş"];
    if (!transferTarihi || !transferTipi || !ALLOWED_TIPLER.includes(transferTipi)) {
      return res.status(400).json({ error: "transferTarihi/transferTipi zorunludur ve geçerli olmalıdır." });
    }

    // 3) Hasta Talep ana kaydı
    const newTalep = await HastaTalep.create({
      ...talepData,
      transferTarihi,
      transferTipi,
      talepEdenId,
      talepEdenAdSoyad,
    });

    // 4) Companions
    const companionIds = await Promise.all(
      (companions || []).map(async (c) => {
        const saved = await Companions.create({ ...c, hastaId: newTalep._id });
        return saved._id;
      })
    );

    // 5) Routes
    const routeIds = await Promise.all((routes || []).map((r) => createRouteRecord(newTalep._id, r)))
      .then((records) => records.map((r) => r._id));

    // 6) Notification Person
    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({ ...notificationPerson, hastaId: newTalep._id });
      notificationId = saved._id;
    }

    // 7) Alt ilişkileri bağla
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    newTalep.notificationPerson = notificationId;
    await newTalep.save();

    const populated = await HastaTalep.findById(newTalep._id)
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac")
      .populate("sofor")
      .populate("lokasyon")
      .populate("talepEdenId");

    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Hasta Talep Hatası:", err);
    res.status(500).json({ error: err?.message || err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Tüm Talepler
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllHastaTalepleri = async (req, res) => {
  try {
    const list = await HastaTalep.find()
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac")
      .populate("sofor")
      .populate("lokasyon")
      .populate("talepEdenId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Tek Talep (+ bolge/country adları)
// ─────────────────────────────────────────────────────────────────────────────
exports.getHastaTalepById = async (req, res) => {
  try {
    const talep = await HastaTalep.findById(req.params.id)
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac")
      .populate("sofor")
      .populate("lokasyon")
      .populate("talepEdenId")
      .lean();

    if (!talep) return res.status(404).json({ error: "Talep bulunamadı." });

    const bolge = talep.bolge ? await Bolge.findById(talep.bolge).lean() : null;
    const country = talep.country
      ? await Ulke.findById(talep.country).populate("bolgeId", "ad").lean()
      : null;

    talep.bolgeName = bolge ? bolge.ad : "-";
    talep.countryName = country ? country.ad : "-";

    res.json(talep);
  } catch (err) {
    console.error("❌ Hata:", err);
    res.status(500).json({ error: "Sunucu hatası", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PUT - Talep Güncelle (alt verileri resetleyip yeniden kurar)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateHastaTalep = async (req, res) => {
  try {
    const id = req.params.id;
    const { companions = [], routes = [], notificationPerson, ...talepData } = req.body;

    await Promise.all([
      Companions.deleteMany({ hastaId: id }),
      Routes.deleteMany({ hastaId: id }),
      NotificationPerson.deleteMany({ hastaId: id }),
    ]);

    const companionIds = await Promise.all(
      (companions || []).map(async (c) => {
        const saved = await Companions.create({ hastaId: id, ...c });
        return saved._id;
      })
    );

    const routeIds = await Promise.all((routes || []).map((r) => createRouteRecord(id, r)))
      .then((records) => records.map((r) => r._id));

    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({ hastaId: id, ...notificationPerson });
      notificationId = saved._id;
    }

    const updated = await HastaTalep.findByIdAndUpdate(
      id,
      { ...talepData, companions: companionIds, routes: routeIds, notificationPerson: notificationId },
      { new: true }
    )
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac")
      .populate("sofor")
      .populate("lokasyon")
      .populate("talepEdenId");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ DELETE - Talep Sil (ilişkili verilerle)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteHastaTalep = async (req, res) => {
  try {
    const id = req.params.id;
    await Promise.all([
      Companions.deleteMany({ hastaId: id }),
      Routes.deleteMany({ hastaId: id }),
      NotificationPerson.deleteMany({ hastaId: id }),
      HastaTalep.findByIdAndDelete(id),
    ]);

    res.json({ message: "Talep ve ilişkili veriler silindi" });
  } catch (err) {
    res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Kullanıcının Lokasyon(lar)ındaki Tüm Talepler
//    (user.lokasyonlar[] varsa $in ile, yoksa user.lokasyon tekil ile)
// ─────────────────────────────────────────────────────────────────────────────
exports.getTaleplerByLokasyon = async (req, res) => {
  try {
    const user = req.user || {};
    const userLokasyonlar = Array.isArray(user.lokasyonlar) ? user.lokasyonlar.filter(Boolean) : [];
    const tekilLokasyon = user.lokasyon || null;

    if (!userLokasyonlar.length && !tekilLokasyon) {
      return res.status(400).json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    const lokasyonFilter = userLokasyonlar.length ? { $in: userLokasyonlar } : tekilLokasyon;

    const talepler = await HastaTalep.find({ lokasyon: lokasyonFilter })
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac", "plaka marka tip")
      .populate("sofor", "name telefon")
      .populate("lokasyon", "ad")
      .populate("talepEdenId");

    res.json(talepler);
  } catch (err) {
    res.status(500).json({ error: "Talepler alınamadı." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PATCH - Araç/Şoför Atama
// ─────────────────────────────────────────────────────────────────────────────
exports.assignAracSofor = async (req, res) => {
  try {
    const { soforId, aracId } = req.body;
    const { id } = req.params;

    const atamaYapanId = req.user?._id || req.userId;
    const atamaYapanAdSoyad = req.user?.fullName || req.user?.name;

    const updatedTalep = await HastaTalep.findByIdAndUpdate(
      id,
      {
        sofor: soforId,
        arac: aracId,
        atamaDurumu: "Evet",
        atamaYapanId,
        atamaYapanAdSoyad
      },
      { new: true }
    )
      .populate("arac", "plaka marka tip")
      .populate("sofor", "name telefon");

    res.json({ message: "Atama başarılı", talep: updatedTalep });
  } catch (err) {
    res.status(500).json({ error: "Atama yapılamadı", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Bekleyen Talepler (çoklu lokasyon desteği)
// ─────────────────────────────────────────────────────────────────────────────
exports.getBekleyenTalepler = async (req, res) => {
  try {
    const explicitLokasyonId = req.lokasyonId;
    const user = req.user || {};
    const userLokasyonlar = Array.isArray(user.lokasyonlar) ? user.lokasyonlar.filter(Boolean) : [];
    const tekilLokasyon = user.lokasyon || null;

    const lokasyonFilter =
      explicitLokasyonId ||
      (userLokasyonlar.length ? { $in: userLokasyonlar } : tekilLokasyon);

    if (!lokasyonFilter) {
      return res.status(400).json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    const filter = {
      lokasyon: lokasyonFilter,
      $or: [{ atamaDurumu: "Hayır" }, { atamaDurumu: { $exists: false } }],
    };

    const list = await HastaTalep.find(filter)
      .populate([
        { path: "arac" },
        { path: "sofor" },
        { path: "lokasyon" },
        { path: "companions" },
        { path: "routes" },
        { path: "notificationPerson" },
        { path: "talepEdenId" }
      ]);

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Talepler alınamadı.", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Onaylanmış Talepler (çoklu lokasyon desteği)
// ─────────────────────────────────────────────────────────────────────────────
exports.getOnaylanmisTalepler = async (req, res) => {
  try {
    const explicitLokasyonId = req.lokasyonId;
    const user = req.user || {};
    const userLokasyonlar = Array.isArray(user.lokasyonlar) ? user.lokasyonlar.filter(Boolean) : [];
    const tekilLokasyon = user.lokasyon || null;

    const lokasyonFilter =
      explicitLokasyonId ||
      (userLokasyonlar.length ? { $in: userLokasyonlar } : tekilLokasyon);

    if (!lokasyonFilter) {
      return res.status(400).json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    const filter = {
      lokasyon: lokasyonFilter,
      $or: [{ atamaDurumu: "Evet" }, { atamaDurumu: { $exists: true } }],
    };

    const list = await HastaTalep.find(filter)
      .populate([
        { path: "arac" },
        { path: "sofor" },
        { path: "lokasyon" },
        { path: "companions" },
        { path: "routes" },
        { path: "notificationPerson" },
        { path: "talepEdenId" }
      ]);

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Talepler alınamadı.", details: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET - Şoför Atamalarım / ById (değişmedi)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSoforAtamalarim = async (req, res) => {
  try {
    const soforId = req.user?._id || req.userId;
    if (!soforId) return res.status(401).json({ error: 'Şoför kimliği bulunamadı.' });

    const { status, dateFrom, dateTo } = req.query;

    const filter = { sofor: soforId, atamaDurumu: 'Evet' };
    if (status) filter.talepDurumu = status;
    if (dateFrom || dateTo) {
      filter.transferTarihi = {};
      if (dateFrom) filter.transferTarihi.$gte = new Date(dateFrom);
      if (dateTo)   filter.transferTarihi.$lte = new Date(dateTo);
    }

    const list = await HastaTalep.find(filter)
      .populate('arac')
      .populate('sofor', 'name telefon')
      .populate('lokasyon', 'ad')
      .populate('companions')
      .populate('routes')
      .populate('notificationPerson')
      .sort({ transferTarihi: 1 });

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Atamalar alınamadı.', details: e.message });
  }
};

exports.getSoforAtamalariById = async (req, res) => {
  try {
    const soforId = req.params.id;
    const { status, dateFrom, dateTo } = req.query;

    const filter = { sofor: soforId, atamaDurumu: 'Evet' };
    if (status) filter.talepDurumu = status;
    if (dateFrom || dateTo) {
      filter.transferTarihi = {};
      if (dateFrom) filter.transferTarihi.$gte = new Date(dateFrom);
      if (dateTo)   filter.transferTarihi.$lte = new Date(dateTo);
    }

    const list = await HastaTalep.find(filter)
      .populate('arac')
      .populate('sofor', 'name telefon')
      .populate('lokasyon', 'ad')
      .populate('companions')
      .populate('routes')
      .populate('notificationPerson')
      .sort({ transferTarihi: 1 });

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Atamalar alınamadı.', details: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PUT /api/hasta-talep/:id/baslat
// ─────────────────────────────────────────────────────────────────────────────
exports.baslatTalep = async (req, res) => {
  try {
    const { id } = req.params;

    const talep = await HastaTalep.findById(id);
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı.' });

    if (talep.isDurumu === 'Tamamlandı') {
      return res.status(400).json({ error: 'Tamamlanmış iş yeniden başlatılamaz.' });
    }

    talep.isDurumu = 'Başladı';
    talep.isBaslamaZamani = new Date();
    await talep.save();

    const populated = await HastaTalep.findById(id)
      .populate('companions')
      .populate('routes')
      .populate('notificationPerson')
      .populate('arac')
      .populate('sofor')
      .populate('lokasyon')
      .populate('talepEdenId');

    res.json({ message: 'İş başlatıldı.', talep: populated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Başlatma hatası' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PUT /api/hasta-talep/:id/tamamla
// ─────────────────────────────────────────────────────────────────────────────
exports.tamamlaTalep = async (req, res) => {
  try {
    const { id } = req.params;

    const talep = await HastaTalep.findById(id);
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı.' });

    if (talep.isDurumu !== 'Başladı') {
      return res.status(400).json({ error: 'İş tamamlanmadan önce başlatılmalıdır.' });
    }

    talep.isDurumu = 'Tamamlandı';
    talep.isBitisZamani = new Date();
    await talep.save();

    const populated = await HastaTalep.findById(id)
      .populate('companions')
      .populate('routes')
      .populate('notificationPerson')
      .populate('arac')
      .populate('sofor')
      .populate('lokasyon')
      .populate('talepEdenId');

    res.json({ message: 'İş tamamlandı.', talep: populated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Tamamlama hatası' });
  }
};

exports.iptalTalep = async (req, res) => {
  try {
    const { id } = req.params;

    const talep = await HastaTalep.findById(id);
    if (!talep) return res.status(404).json({ error: 'Talep bulunamadı.' });

    if (talep.isDurumu === 'Tamamlandı') {
      return res.status(400).json({ error: 'Tamamlanmış iş iptal edilemez.' });
    }

    talep.talepDurumu = 'İptal';
    talep.iptalZamani = new Date();
    talep.iptalNedeni = req.body?.neden || null;
    await talep.save();

    const populated = await HastaTalep.findById(id)
      .populate('companions')
      .populate('routes')
      .populate('notificationPerson')
      .populate('arac')
      .populate('sofor')
      .populate('lokasyon')
      .populate('talepEdenId');

    res.json({ message: 'İş iptal edildi.', talep: populated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'İptal hatası' });
  }
};

exports.updateLokasyon = async (req, res) => {
  try {
    const { id } = req.params;
    const { lokasyonId } = req.body;

    if (!lokasyonId || !mongoose.Types.ObjectId.isValid(lokasyonId)) {
      return res.status(400).json({ error: "Geçerli bir lokasyonId giriniz." });
    }

    const userId = req.user?._id || req.userId;
    const userName = req.user?.fullName || req.user?.name;
    if (!userId || !userName) {
      return res.status(401).json({ error: "İşlemi yapan kullanıcı bulunamadı." });
    }

    const talep = await HastaTalep.findById(id).populate("lokasyon", "ad");
    if (!talep) return res.status(404).json({ error: "Talep bulunamadı." });

    // Aynı lokasyonsa no-op
    if (String(talep.lokasyon) === String(lokasyonId)) {
      return res.json({ message: "Lokasyon zaten bu değer.", talep });
    }

    const eskiLokasyon = talep.lokasyon || null;

    // Güncelle
    talep.lokasyon = lokasyonId;
    talep.lokasyonSonDegistirenId = userId;
    talep.lokasyonSonDegistirenAdSoyad = userName;
    talep.lokasyonSonDegistirmeZamani = new Date();

    talep.lokasyonDegisiklikleri.push({
      eskiLokasyon: eskiLokasyon?._id || eskiLokasyon,
      yeniLokasyon: lokasyonId,
      degistirenId: userId,
      degistirenAdSoyad: userName,
      degistirmeZamani: new Date()
    });

    await talep.save();

    const populated = await HastaTalep.findById(id)
      .populate("lokasyon", "ad")
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson")
      .populate("arac")
      .populate("sofor")
      .populate("talepEdenId")
      .populate({ path: "lokasyonDegisiklikleri.eskiLokasyon", select: "ad" })
      .populate({ path: "lokasyonDegisiklikleri.yeniLokasyon", select: "ad" })
      .populate({ path: "lokasyonSonDegistirenId", select: "name email" });

    return res.json({ message: "Lokasyon güncellendi.", talep: populated });
  } catch (err) {
    return res.status(500).json({ error: "Lokasyon güncellenemedi.", details: err.message });
  }
};
