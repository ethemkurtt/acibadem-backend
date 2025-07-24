const express = require("express");
const router = express.Router();
const personelTalepController = require("../controllers/personelTalep.controller");

// GET - Tüm Personel Talepleri
router.get("/", personelTalepController.getAllPersonelTalepleri);

// GET - Tek Talep (ID ile)
router.get("/:id", personelTalepController.getPersonelTalepById);

// POST - Yeni Talep Oluştur
router.post("/", personelTalepController.createPersonelTalep);

// PUT - Talep Güncelle (ID ile)
router.put("/:id", personelTalepController.updatePersonelTalep);

// DELETE - Talep Sil (ID ile)
router.delete("/:id", personelTalepController.deletePersonelTalep);

// DELETE - Tüm Talepleri Temizle (Geliştirme amaçlı)
router.delete("/", personelTalepController.clearAllPersonelTalepleri);

module.exports = router;
