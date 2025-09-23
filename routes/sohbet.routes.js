const express = require("express");
const router = express.Router();
const sohbetController = require("../controllers/sohbet.controller");
const { authRequired } = require("../middlewares/auth");

// ✅ Yeni sohbet başlat
router.post("/", authRequired, sohbetController.createSohbet);

// ✅ Mesaj gönder
router.post("/mesaj", authRequired, sohbetController.sendMessage);

// ✅ Sohbet mesajlarını getir
router.get("/:sohbet_id/mesajlar", authRequired, sohbetController.getMessages);

// ✅ Kullanıcının sohbetlerini getir
router.get("/my", authRequired, sohbetController.getMySohbets);

module.exports = router;
