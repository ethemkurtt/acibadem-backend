// routes/index.js
// Düzenlenmiş ve sertleştirilmiş router:
// - Tutarlı endpoint isimleri (/auth/*)
// - Geriye dönük uyumluluk (eski yollar da açık)
// - Rate limit (login / forgot)
// - Sıralama ve koruma netliği

const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const { authRequired: authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/authz");

const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

/* ──────────────────────────────────────────────────────────────────────────────
   RATE LIMITERS (temel)
   ─────────────────────────────────────────────────────────────────────────── */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dk
  max: 10,             // 1 dk'da 10 deneme
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dk
  max: 5,              // 1 dk'da 5 istek
  standardHeaders: true,
  legacyHeaders: false,
});

/* ──────────────────────────────────────────────────────────────────────────────
   PUBLIC (JWT gerekmez)
   - Yeni, tutarlı yollar: /auth/*
   - Eski yollar: /login (geri uyum)
   ─────────────────────────────────────────────────────────────────────────── */

// Login
router.post(["/auth/login", "/login"], loginLimiter, authController.login);

// Şifre sıfırlama akışı
router.post("/auth/forgot", forgotLimiter, authController.forgotPassword);
router.get("/auth/reset/verify", authController.verifyResetToken);
router.post("/auth/reset", authController.resetPassword);

/* ──────────────────────────────────────────────────────────────────────────────
   PROTECTED (JWT zorunlu)
   ─────────────────────────────────────────────────────────────────────────── */

// Me (yeni ve eski yol)
router.get(["/auth/me", "/me"], authenticate, authController.getMe);

// Users CRUD (tamamı korumalı)
router.use("/users", authenticate);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.post("/users", userController.createUser);

// Sadece superadmin erişimi olan örnek endpoint
router.get(
  "/admin/panel",
  authenticate,
  requireRole("superadmin"),
  (req, res) => res.json({ message: "Süper admin paneline hoş geldiniz." })
);

module.exports = router;
