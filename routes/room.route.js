const express = require("express");
const router = express.Router();
const Room = require("../models/room.model");

// ➕ Oda Ekle
router.post("/", async (req, res) => {
  try {
    const newRoom = await Room.create(req.body);
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📥 Tüm Odaları Listele
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().populate({
      path: "otelId",
      select: "otelAdi lokasyon", // sadece bu alanları getir
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔎 Belirli Odayı Getir
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("otelId");
    res.json(room);
  } catch (err) {
    res.status(404).json({ error: "Oda bulunamadı" });
  }
});

// ✏️ Güncelle
router.put("/:id", async (req, res) => {
  try {
    const updated = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ❌ Sil
router.delete("/:id", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Silindi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
