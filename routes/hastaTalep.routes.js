// ✅ routes/hastaTalep.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");


const hastaTalepController = require("../controllers/hastaTalep.controller");

// 📂 Dosya upload klasörü
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ─────────────────────────────────────────────────────────────
// 🚨 AUTH korumalı rota
// ─────────────────────────────────────────────────────────────

// ✅ 1. Talep oluştur
router.post(
  "/",
  auth,
  upload.fields([{ name: "documents", maxCount: 10 }]),
  hastaTalepController.createHastaTalep
);

// ✅ 2. Tüm talepleri getir (admin view)
router.get("/", hastaTalepController.getAllHastaTalepleri);

// ✅ 3. Lokasyona göre talepler
router.get("/lokasyon",  hastaTalepController.getTaleplerByLokasyon);

// ✅ 4. Tek talep detayı
router.get("/:id",  hastaTalepController.getHastaTalepById);

// ✅ 5. Talep güncelle
router.put("/:id",  hastaTalepController.updateHastaTalep);

// ✅ 6. Talep sil
router.delete("/:id", hastaTalepController.deleteHastaTalep);

// ✅ 7. Şoför + araç atama
router.put("/:id/atama",  hastaTalepController.assignAracSofor);
router.get("/bekleyen",  hastaTalepController.getBekleyenTalepler);

module.exports = router;
