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
// 📌 Dosya kaydetme yardımcı fonksiyonu (şu an string path geldiği için kullanılmıyor)
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
// 📌 Tek route kaydı oluşturma (gelen string değerleri muhafaza eder)
// ─────────────────────────────────────────────────────────────────────────────
const createRouteRecord = async (hastaId, routeData) => {
  const processSide = async (side) => {
    if (!routeData[side]) return null;

    const sideData = { ...routeData[side] };

    // locationId boşsa tamamen çıkar
    if (!sideData.locationId || sideData.locationId === "") {
      delete sideData.locationId;
    }

    // ticket string ise kaydet
    if (routeData[side].ticket && routeData[side].ticket !== "") {
      sideData.ticket = routeData[side].ticket;
    } else {
      delete sideData.ticket;
    }

    // passport array/string normalize
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
// ✅ POST - Yeni Talep Oluştur
//  - talepEden bilgilerini set eder
//  - transferTarihi/transferTipi yoksa routes'tan türetir
//  - alt koleksiyonları oluşturup HastaTalep ile bağlar
// ─────────────────────────────────────────────────────────────────────────────
exports.createHastaTalep = async (req, res) => {
  try {
    const { companions = [], routes = [], notificationPerson, ...talepData } = req.body;

    // 1) Talebi oluşturan kullanıcı bilgileri (auth middleware’inize göre düzenleyin)
    const talepEdenId = req.user?._id || req.userId;
    const talepEdenAdSoyad = req.user?.fullName || req.user?.name || req.headers["x-user-name"];
    if (!talepEdenId || !talepEdenAdSoyad) {
      return res.status(400).json({ error: "Talebi oluşturan kullanıcı bilgisi eksik (talepEdenId / talepEdenAdSoyad)." });
    }

    // 2) transferTarihi & transferTipi türet (şema required)
    let transferTarihi = talepData.transferTarihi;
    let transferTipi = talepData.transferTipi;

    if ((!transferTarihi || !transferTipi) && Array.isArray(routes) && routes.length > 0) {
      const firstPickup = routes.find(r => r?.pickup?.date)?.pickup;

      if (!transferTarihi) {
        if (!firstPickup?.date) {
          return res.status(400).json({ error: "transferTarihi eksik: en az bir güzergah için pickup tarih/saat seçilmelidir." });
        }
        const dt = new Date(firstPickup.date); // datetime-local uyumlu
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

    // 3) Hasta Talep ana kaydı oluştur
    const newTalep = await HastaTalep.create({
      ...talepData,
      transferTarihi,
      transferTipi,
      talepEdenId,
      talepEdenAdSoyad,
    });

    // 4) Companions ekle
    const companionIds = await Promise.all(
      (companions || []).map(async (c) => {
        const saved = await Companions.create({ ...c, hastaId: newTalep._id });
        return saved._id;
      })
    );

    // 5) Routes ekle
    const routeIds = await Promise.all((routes || []).map((r) => createRouteRecord(newTalep._id, r)))
      .then((records) => records.map((r) => r._id));

    // 6) Notification Person ekle
    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({ ...notificationPerson, hastaId: newTalep._id });
      notificationId = saved._id;
    }

    // 7) Talep alt ilişkileri bağla
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    newTalep.notificationPerson = notificationId;
    await newTalep.save();

    // (İsterseniz populate ederek tam dönebilirsiniz)
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
// ✅ GET - Kullanıcının Lokasyonundaki Tüm Talepler
// ─────────────────────────────────────────────────────────────────────────────
exports.getTaleplerByLokasyon = async (req, res) => {
  try {
    const lokasyonId = req.user.lokasyon;

    const talepler = await HastaTalep.find({ lokasyon: lokasyonId })
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

    const updatedTalep = await HastaTalep.findByIdAndUpdate(
      id,
      { sofor: soforId, arac: aracId, atamaDurumu: "Evet" },
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
// ✅ GET - Bekleyen Talepler (lokasyona göre, full populate)
// ─────────────────────────────────────────────────────────────────────────────
exports.getBekleyenTalepler = async (req, res) => {
  try {
    const lokasyonId = req.lokasyonId; // middleware’de set edilmiş olmalı
    if (!lokasyonId) {
      return res.status(400).json({ error: "Kullanıcının lokasyon bilgisi eksik." });
    }

    const filter = {
      lokasyon: lokasyonId,
      $or: [{ atamaDurumu: "Hayır" }, { atamaDurumu: { $exists: false } }],
    };

    const list = await HastaTalep.find(filter)
      .populate([{ path: "arac" }, { path: "sofor" }, { path: "lokasyon" },
                 { path: "companions" }, { path: "routes" }, { path: "notificationPerson" },
                 { path: "talepEdenId" }]);

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Talepler alınamadı.", details: err.message });
  }
};
