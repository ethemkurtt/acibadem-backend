const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const HastaTalep = require("../models/hastaTalepModels/hastaTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");
const Routes = require("../models/hastaTalepModels/routes.model");

// 📌 Dosya kaydetme yardımcı fonksiyonu
const saveFileInfo = (file, folder) => {
  if (!file) return null;
  const uploadPath = `/uploads/${folder}/${Date.now()}-${file.originalname}`;
  const targetPath = path.join(__dirname, "../../public", uploadPath);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.renameSync(file.path, targetPath);

  return { fileName: file.originalname, filePath: uploadPath };
};

// 📌 Tek route kaydı oluşturma
const createRouteRecord = async (hastaId, routeData) => {
  const processSide = async (side) => {
    if (!routeData[side]) return null;

    const sideData = { ...routeData[side] };

    // ✅ Eğer ticketFile varsa kaydet, yoksa hiç ekleme
    if (routeData[side].ticketFile && routeData[side].ticketFile.originalname) {
      sideData.ticket = saveFileInfo(routeData[side].ticketFile, "tickets");
    } else {
      delete sideData.ticket; // ❌ Boş string gitmesin
    }

    // ✅ Eğer passportFiles varsa kaydet, yoksa hiç ekleme
    if (Array.isArray(routeData[side].passportFiles) && routeData[side].passportFiles.length) {
      sideData.passport = routeData[side].passportFiles.map((file) =>
        saveFileInfo(file, "passports")
      );
    } else {
      delete sideData.passport; // ❌ Boş array veya string gitmesin
    }

    return sideData;
  };

  return await Routes.create({
    hastaId,
    pickup: await processSide("pickup"),
    drop: await processSide("drop"),
  });
};

// ✅ POST - Yeni Talep Oluştur
exports.createHastaTalep = async (req, res) => {
  try {
    const { companions = [], routes = [], notificationPerson, ...talepData } =
      req.body;

    // 1️⃣ Hasta Talep kaydı oluştur
    const newTalep = await HastaTalep.create(talepData);

    // 2️⃣ Companions ekle
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await Companions.create({ ...c, hastaId: newTalep._id });
        return saved._id;
      })
    );

    // 3️⃣ Routes ekle (dosyalarla birlikte)
    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(newTalep._id, r))
    ).then((records) => records.map((r) => r._id));

    // 4️⃣ Notification Person ekle
    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({
        ...notificationPerson,
        hastaId: newTalep._id,
      });
      notificationId = saved._id;
    }

    // 5️⃣ Talep güncelle
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    newTalep.notificationPerson = notificationId;
    await newTalep.save();

    res.status(201).json(newTalep);
  } catch (err) {
    console.error("❌ Hasta Talep Hatası:", err);
    res.status(500).json({ error: "Bir hata oluştu." });
  }
};

// ✅ GET - Tüm Talepler
exports.getAllHastaTalepleri = async (req, res) => {
  try {
    const list = await HastaTalep.find()
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

// ✅ GET - Tek Talep
exports.getHastaTalepById = async (req, res) => {
  try {
    const talep = await HastaTalep.findById(req.params.id)
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson");

    if (!talep) return res.status(404).json({ error: "Talep bulunamadı." });

    res.json(talep);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası", details: err.message });
  }
};

// ✅ PUT - Talep Güncelle
exports.updateHastaTalep = async (req, res) => {
  try {
    const id = req.params.id;
    const { companions = [], routes = [], notificationPerson, ...talepData } =
      req.body;

    // Eski alt verileri sil
    await Promise.all([
      Companions.deleteMany({ hastaId: id }),
      Routes.deleteMany({ hastaId: id }),
      NotificationPerson.deleteMany({ hastaId: id }),
    ]);

    // Yeni alt verileri ekle
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await Companions.create({ hastaId: id, ...c });
        return saved._id;
      })
    );

    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(id, r))
    ).then((records) => records.map((r) => r._id));

    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({
        hastaId: id,
        ...notificationPerson,
      });
      notificationId = saved._id;
    }

    // Talebi güncelle
    const updated = await HastaTalep.findByIdAndUpdate(
      id,
      { ...talepData, companions: companionIds, routes: routeIds, notificationPerson: notificationId },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

// ✅ DELETE - Talep Sil
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
