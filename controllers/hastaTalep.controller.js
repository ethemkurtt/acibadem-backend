const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");

const HastaTalep = require("../models/hastaTalepModels/hastaTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");
const Routes = require("../models/hastaTalepModels/routes.model");

// POST - Talep Oluştur
exports.createHastaTalep = async (req, res) => {
  try {
    const {
      fullName,
      passportNo,
      phone,
      country,
      language,
      wheelchair,
      lokasyon,
      kategori,
      transferType,
      flightCode,
      gelisHavalimani,
      kalkisSaati,
      inisSaati,
      baggageCount,
      donusHavalimani,
      donusKalkisSaati,
      donusInisSaati,
      donusBaggageCount,
      companions,
      routes,
      notificationPerson,
      requestType,
    } = req.body;

    // 1. Talep oluştur
    const newTalep = await HastaTalep.create({
      requestType,
      fullName,
      passportNo,
      phone,
      country,
      language,
      wheelchair,
      lokasyon,
      kategori,
      transferType,
      flightCode,
      gelisHavalimani,
      kalkisSaati,
      inisSaati,
      baggageCount,
      donusHavalimani,
      donusKalkisSaati,
      donusInisSaati,
      donusBaggageCount,
    });

    // 2. Refakatçiler
    const companionIds = [];
    if (companions?.length) {
      for (const comp of companions) {
        const saved = await Companions.create({
          ...comp,
          hastaId: newTalep._id,
        });
        companionIds.push(saved._id);
      }
    }

    // 3. Güzergah
    const routeIds = [];
    if (routes?.length) {
      for (const r of routes) {
        const saved = await Routes.create({
          ...r,
          hastaId: newTalep._id,
        });
        routeIds.push(saved._id);
      }
    }

    // 4. Bilgilendirilecek kişi
    let notificationId = null;
    if (notificationPerson) {
      const saved = await NotificationPerson.create({
        ...notificationPerson,
        hastaId: newTalep._id,
      });
      notificationId = saved._id;
    }

    // 5. Güncelle talebi
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    newTalep.notificationPerson = notificationId;
    await newTalep.save();

    res.status(201).json(newTalep);
  } catch (err) {
    console.error("Hasta Talep Hatası:", err);
    res.status(500).json({ error: "Bir hata oluştu." });
  }
};

// GET - Tüm Talepleri Getir
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

// GET - Tek Talep
exports.getHastaTalepById = async (req, res) => {
  try {
    const id = req.params.id; // ← Burası eksikti
    const talep = await HastaTalep.findById(id)
      .populate("country", "ad")
      .populate("gelisHavalimani", "adi")
      .populate("donusHavalimani", "adi")
      .populate("companions")
      .populate("routes")
      .populate("notificationPerson");
    console.log(talep);
    if (!talep) {
      return res.status(404).json({ error: "Talep bulunamadı." });
    }

    res.status(200).json(talep);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// DELETE - Talep Sil
exports.deleteHastaTalep = async (req, res) => {
  try {
    const id = req.params.id;
    await Companions.deleteMany({ hastaId: id });
    await Routes.deleteMany({ hastaId: id });
    await NotificationPerson.deleteMany({ hastaId: id });
    await HastaTalep.findByIdAndDelete(id);
    res.json({ message: "Talep ve ilişkili veriler silindi" });
  } catch (err) {
    res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};

// PUT - Talep Güncelle
exports.updateHastaTalep = async (req, res) => {
  try {
    const id = req.params.id;
    const { companions = [], routes = [], notificationPerson = {} } = req.body;

    // Mevcut alt verileri temizle
    await Promise.all([
      Companions.deleteMany({ hastaId: id }),
      Routes.deleteMany({ hastaId: id }),
      NotificationPerson.deleteMany({ hastaId: id }),
    ]);

    // Yeni alt verileri tekrar ekle
    const companionIds = [];
    for (const c of companions) {
      const saved = await Companions.create({ hastaId: id, ...c });
      companionIds.push(saved._id);
    }

    const routeIds = [];
    for (const r of routes) {
      const saved = await Routes.create({ hastaId: id, ...r });
      routeIds.push(saved._id);
    }

    let notificationId = null;
    if (notificationPerson && typeof notificationPerson === "object") {
      const saved = await NotificationPerson.create({
        hastaId: id,
        ...notificationPerson,
      });
      notificationId = saved._id;
    }

    // Talep güncelle
    const updated = await HastaTalep.findByIdAndUpdate(
      id,
      {
        ...req.body,
        companions: companionIds,
        routes: routeIds,
        notificationPerson: notificationId,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

// DELETE - Tümünü Temizle (Geliştirme/Test Amaçlı)
exports.clearAllHastaTalepleri = async (req, res) => {
  try {
    await Promise.all([
      Companions.deleteMany({}),
      Routes.deleteMany({}),
      NotificationPerson.deleteMany({}),
      HastaTalep.deleteMany({}),
    ]);
    res.json({ message: "Tüm talepler ve ilişkili veriler temizlendi." });
  } catch (err) {
    res.status(500).json({ error: "Temizleme hatası", details: err.message });
  }
};
