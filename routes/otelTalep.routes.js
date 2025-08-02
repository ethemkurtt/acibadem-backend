const express = require("express");
const router = express.Router();
const otelTalepController = require("../controllers/otelTalep.controller");

router.get("/", otelTalepController.getAll);       // 📌 Tüm talepler
router.get("/:id", otelTalepController.getById);  // 📌 Tek talep
router.post("/", otelTalepController.create);     // 📌 Yeni talep
router.put("/:id", otelTalepController.update);   // 📌 Güncelle
router.delete("/:id", otelTalepController.remove);// 📌 Sil

module.exports = router;
