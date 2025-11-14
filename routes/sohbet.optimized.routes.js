const express = require("express");
const router = express.Router();
const sohbetController = require("../controllers/sohbet.optimized.controller");
const { authRequired } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validation");
const Joi = require("joi");

// Validation şemaları
const sohbetSchemas = {
  create: Joi.object({
    hedef_user_id: Joi.string().hex().length(24).required().messages({
      "string.hex": "Geçerli bir ObjectId giriniz",
      "string.length": "ObjectId 24 karakter olmalı",
      "any.required": "Hedef kullanıcı ID zorunludur",
    }),
    sohbet_tipi: Joi.string().optional(),
  }),

  sendMessage: Joi.object({
    sohbet_id: Joi.string().required().messages({
      "any.required": "Sohbet ID zorunludur",
    }),
    message: Joi.string().min(1).max(5000).required().messages({
      "string.min": "Mesaj en az 1 karakter olmalı",
      "string.max": "Mesaj en fazla 5000 karakter olabilir",
      "any.required": "Mesaj zorunludur",
    }),
  }),

  markAsRead: Joi.object({
    sohbet_id: Joi.string().required().messages({
      "any.required": "Sohbet ID zorunludur",
    }),
  }),
};

// ==================== ROUTES ====================

// ✅ Yeni sohbet başlat
router.post(
  "/",
  authRequired,
  validateRequest(sohbetSchemas.create),
  sohbetController.createSohbet
);

// ✅ Mesaj gönder (HTTP fallback - WebSocket tercih edilir)
router.post(
  "/mesaj",
  authRequired,
  validateRequest(sohbetSchemas.sendMessage),
  sohbetController.sendMessage
);

// ✅ Kullanıcının sohbetlerini getir (Optimize edilmiş)
router.get("/my", authRequired, sohbetController.getMySohbets);

// ✅ Okunmamış mesaj sayısı
router.get("/unread/count", authRequired, sohbetController.getUnreadCount);

// ✅ Sohbet mesajlarını getir (Pagination)
router.get("/:sohbet_id/mesajlar", authRequired, sohbetController.getMessages);

// ✅ Mesajları okundu işaretle
router.post(
  "/messages/mark-read",
  authRequired,
  validateRequest(sohbetSchemas.markAsRead),
  sohbetController.markMessagesAsRead
);

// ✅ Sohbet sil (sadece başlatan silebilir)
router.delete("/:sohbet_id", authRequired, sohbetController.deleteSohbet);

module.exports = router;

