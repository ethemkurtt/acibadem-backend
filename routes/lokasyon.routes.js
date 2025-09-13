const express = require("express");
const router = express.Router();

const {
  importLokasyonlar,
  getAllLokasyonlar,
  deleteAllLokasyonlar,
  patchLokasyon,
  createLokasyon // ← Ekleme fonksiyonu
} = require("../controllers/lokasyon.controller");

// ✅ Lokasyon Ekleme Route
router.post("/", createLokasyon);

// Diğer route'lar
router.post("/import", importLokasyonlar);
router.get("/", getAllLokasyonlar);
router.delete("/", deleteAllLokasyonlar);
router.patch("/:id", patchLokasyon);

module.exports = router;
