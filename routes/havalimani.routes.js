const express = require("express");
const router = express.Router();

const {
  importHavalimanlari,
  getAllHavalimanlari,
  getOneHavalimani,
  createHavalimani,
  updateHavalimani,
  deleteHavalimani,
  deleteAllHavalimanlari,
} = require("../controllers/havalimani.controller");

// Excel'den toplu içe aktarım
router.post("/import", importHavalimanlari);

// Listeleme (Tüm Havalimanları)
router.get("/", getAllHavalimanlari);

// Tek Havalimanı Getir
router.get("/:id", getOneHavalimani);

// Yeni Havalimanı Ekle
router.post("/", createHavalimani);

// Havalimanı Güncelle
router.put("/:id", updateHavalimani);

// Havalimanı Sil
router.delete("/:id", deleteHavalimani);

// Tümünü Sil (opsiyonel)
router.delete("/", deleteAllHavalimanlari);

module.exports = router;
