// routes/sehirler.js
const express = require("express");
const router = express.Router();
const Sehir = require("../models/Sehir");

// LIST (tümü) - ?q=ank ve ?limit & ?skip destekli
router.get("/", async (req, res) => {
  try {
    const { q, limit = 200, skip = 0 } = req.query;
    const filter = q ? { name: { $regex: q, $options: "i" } } : {};
    const data = await Sehir.find(filter).sort({ sehirId: 1 }).skip(+skip).limit(+limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET by id (Mongo _id değil, sehirId)
router.get("/:sehirId", async (req, res) => {
  try {
    const item = await Sehir.findOne({ sehirId: +req.params.sehirId });
    if (!item) return res.status(404).json({ message: "Şehir bulunamadı" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { sehirId, name } = req.body;
    const created = await Sehir.create({ sehirId, name });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Aynı sehirId veya name zaten mevcut" });
    }
    res.status(400).json({ message: err.message });
  }
});

// UPDATE (tam veya kısmi)
router.put("/:sehirId", async (req, res) => {
  try {
    const updated = await Sehir.findOneAndUpdate(
      { sehirId: +req.params.sehirId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Şehir bulunamadı" });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Aynı name başka bir kayıtla çakışıyor" });
    }
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:sehirId", async (req, res) => {
  try {
    const updated = await Sehir.findOneAndUpdate(
      { sehirId: +req.params.sehirId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Şehir bulunamadı" });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Aynı name başka bir kayıtla çakışıyor" });
    }
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete("/:sehirId", async (req, res) => {
  try {
    const deleted = await Sehir.findOneAndDelete({ sehirId: +req.params.sehirId });
    if (!deleted) return res.status(404).json({ message: "Şehir bulunamadı" });
    res.json({ message: "Silindi", deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// (Opsiyonel) BULK ekleme
router.post("/bulk", async (req, res) => {
  try {
    const payload = req.body; // [{sehirId, name}, ...]
    if (!Array.isArray(payload) || payload.length === 0)
      return res.status(400).json({ message: "Dizi bekleniyor" });

    const result = await Sehir.insertMany(payload, { ordered: false });
    res.status(201).json({ insertedCount: result.length });
  } catch (err) {
    // duplicate’leri es geçip diğerlerini eklemek için ordered:false kullandık
    if (err.writeErrors) {
      const insertedCount = err.result?.result?.nInserted ?? 0;
      return res.status(207).json({
        message: "Bazı kayıtlar eklendi, bazıları zaten mevcut",
        insertedCount
      });
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
