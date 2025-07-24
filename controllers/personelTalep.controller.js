const mongoose = require("mongoose");
const PersonelTalep = require("../models/personelTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");

// POST - Personel Talep Oluştur
exports.createPersonelTalep = async (req, res) => {
  try {
    const {
      requestType,
      fullName,
      passportNo,
      phone,
      email,
      lokasyon,
      departman,
      soforDurumu,
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
      companions = [],
      routes = [],
    } = req.body;

    // 1. Ana Talep
    const newTalep = await PersonelTalep.create({
      requestType,
      fullName,
      passportNo,
      phone,
      email,
      lokasyon,
      departman,
      soforDurumu,
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

    // 2. Companions (refakatçi)
    const companionIds = [];
    for (const c of companions) {
      const saved = await Companions.create({
        ...c,
        hastaId: newTalep._id,
      });
      companionIds.push(saved._id);
    }

    // 3. Routes (güzergah)
    const routeIds = [];
    for (const r of routes) {
      const saved = await Routes.create({
        ...r,
        hastaId: newTalep._id,
      });
      routeIds.push(saved._id);
    }

    // 4. Talebi güncelle
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    await newTalep.save();

    res.status(201).json(newTalep);
  } catch (err) {
    console.error("Personel Talep Hatası:", err);
    res.status(500).json({ error: "Bir hata oluştu", details: err.message });
  }
};

// GET - Tüm Personel Talepleri
exports.getAllPersonelTalepleri = async (req, res) => {
  try {
    const list = await PersonelTalep.find()
      .populate("companions")
      .populate("routes")
      .populate("gelisHavalimani", "adi")
      .populate("donusHavalimani", "adi");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

// GET - Tek Personel Talep (ID ile)
exports.getPersonelTalepById = async (req, res) => {
  try {
    const id = req.params.id;
    const talep = await PersonelTalep.findById(id)
      .populate("companions")
      .populate("routes")
      .populate("gelisHavalimani", "adi")
      .populate("donusHavalimani", "adi");
    if (!talep) {
      return res.status(404).json({ error: "Talep bulunamadı" });
    }
    res.json(talep);
  } catch (err) {
    res.status(500).json({ error: "Getirme hatası", details: err.message });
  }
};

// PUT - Talep Güncelle (ID ile)
exports.updatePersonelTalep = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      companions = [],
      routes = [],
      ...otherData
    } = req.body;

    // 1. Önce ilişkili alt verileri sil
    await Companions.deleteMany({ hastaId: id });
    await Routes.deleteMany({ hastaId: id });

    // 2. Yeni verileri ekle
    const companionIds = [];
    for (const c of companions) {
      const saved = await Companions.create({ ...c, hastaId: id });
      companionIds.push(saved._id);
    }

    const routeIds = [];
    for (const r of routes) {
      const saved = await Routes.create({ ...r, hastaId: id });
      routeIds.push(saved._id);
    }

    // 3. Ana talebi güncelle
    const updated = await PersonelTalep.findByIdAndUpdate(
      id,
      {
        ...otherData,
        companions: companionIds,
        routes: routeIds,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

// DELETE - Talep Sil (ID ile)
exports.deletePersonelTalep = async (req, res) => {
  try {
    const id = req.params.id;
    await Companions.deleteMany({ hastaId: id });
    await Routes.deleteMany({ hastaId: id });
    await PersonelTalep.findByIdAndDelete(id);
    res.json({ message: "Talep ve ilişkili veriler silindi." });
  } catch (err) {
    res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};

// DELETE - Tümünü Temizle (Geliştirme amaçlı)
exports.clearAllPersonelTalepleri = async (req, res) => {
  try {
    await Promise.all([
      Companions.deleteMany({}),
      Routes.deleteMany({}),
      PersonelTalep.deleteMany({}),
    ]);
    res.json({ message: "Tüm personel talepleri ve alt veriler temizlendi." });
  } catch (err) {
    res.status(500).json({ error: "Temizleme hatası", details: err.message });
  }
};
