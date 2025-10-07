// controllers/hastaTalepDetay.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");
const HastaDetay = require("../models/talepler/hastaTalepDetay.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// 1) Tek başına HastaDetay oluştur (mevcut bir talep_id için)
exports.create = async (req, res) => {
  try {
    const { talep_id } = req.body || {};
    if (!talep_id || !isValidObjectId(talep_id)) {
      return res.status(400).json({ message: "Geçerli talep_id gerekli" });
    }

    const talep = await Talepler.findById(talep_id);
    if (!talep) return res.status(404).json({ message: "Talepler kaydı bulunamadı" });
    if (talep.requestType && talep.requestType !== "hasta") {
      return res.status(400).json({ message: "Talep requestType 'hasta' olmalı" });
    }

    const doc = await HastaDetay.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: "Hasta detay oluşturulamadı", error: err.message });
  }
};

// 2) Birleştirilmiş oluşturma (tek istekle): Talepler + HastaDetay
exports.createCombined = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { talep = {}, detay = {} } = req.body || {};

    // Talep için requestType'ı zorunlu kılalım: 'hasta'
    const talepPayload = { requestType: "hasta", ...talep };

    const talepDoc = await Talepler.create([talepPayload], { session });
    const createdTalep = talepDoc[0];

    const detayPayload = { ...detay, talep_id: createdTalep._id };
    const detayDoc = await HastaDetay.create([detayPayload], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      talep: createdTalep,
      detay: detayDoc[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: "Birleştirilmiş oluşturma başarısız", error: err.message });
  }
};

// 3) Detay'ı talep_id ile getir
exports.getByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isValidObjectId(talepId)) return res.status(400).json({ message: "Geçersiz talepId" });

    const doc = await HastaDetay.findOne({ talep_id: talepId })
      .populate("bolge country notificationPerson")
      .populate("routes")
      .populate("companions");

    if (!doc) return res.status(404).json({ message: "Hasta detay bulunamadı" });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Hasta detay getirilemedi", error: err.message });
  }
};

// 4) Detay'ı talep_id ile güncelle (upsert opsiyonel)
exports.updateByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isValidObjectId(talepId)) return res.status(400).json({ message: "Geçersiz talepId" });

    const updated = await HastaDetay.findOneAndUpdate(
      { talep_id: talepId },
      req.body,
      { new: true, runValidators: true, upsert: false }
    );

    if (!updated) return res.status(404).json({ message: "Hasta detay bulunamadı" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Hasta detay güncellenemedi", error: err.message });
  }
};

// 5) Detay'ı talep_id ile sil
exports.deleteByTalepId = async (req, res) => {
  try {
    const { talepId } = req.params;
    if (!isValidObjectId(talepId)) return res.status(400).json({ message: "Geçersiz talepId" });

    const deleted = await HastaDetay.findOneAndDelete({ talep_id: talepId });
    if (!deleted) return res.status(404).json({ message: "Hasta detay bulunamadı" });

    res.json({ message: "Silindi", talep_id: talepId });
  } catch (err) {
    res.status(500).json({ message: "Hasta detay silinemedi", error: err.message });
  }
};
