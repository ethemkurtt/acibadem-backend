// ✅ routes/hastaTalep.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");

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
router.get("/", auth, hastaTalepController.getAllHastaTalepleri);

// ✅ 3. Lokasyona göre talepler
router.get("/lokasyon", auth, hastaTalepController.getTaleplerByLokasyon);

// ✅ 4. Tek talep detayı
router.get("/:id", auth, hastaTalepController.getHastaTalepById);

// ✅ 5. Talep güncelle
router.put("/:id", auth, hastaTalepController.updateHastaTalep);

// ✅ 6. Talep sil
router.delete("/:id", auth, hastaTalepController.deleteHastaTalep);

// ✅ 7. Şoför + araç atama
router.put("/:id/atama", auth, hastaTalepController.assignAracSofor);
router.get("/bekleyen", auth, hastaTalepController.getBekleyenTalepler);

module.exports = router;
