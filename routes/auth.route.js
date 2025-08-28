// routes/auth.route.js
const express = require("express");
const router = express.Router();

// Auth middleware: auth.js içinde exports.authRequired var.
// Bunu authenticate adıyla alias'lıyoruz ki mevcut isimlendirme korunabilsin.
const { authRequired: authenticate } = require("../middlewares/auth");

// Rol kontrolü (factory olmalı: requireRole("role") => (req,res,next) => ...)
const { requireRole } = require("../middlewares/authz");

// Controller'lar
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

/* ============================================================================
 *  AUTH
 * ===========================================================================*/

// Giriş
router.post("/login", authController.login);

// Şifre Sıfırlama (public)
router.post("/auth/forgot",       authController.forgotPassword);
router.get ("/auth/reset/verify", authController.verifyResetToken);
router.post("/auth/reset",        authController.resetPassword);

// Kendi profilini getir (JWT zorunlu)
router.get("/me", authenticate, authController.getMe);

/* ============================================================================
 *  Süperadmin örnek uç
 * ===========================================================================*/
router.get(
  "/admin/panel",
  authenticate,              // önce JWT
  requireRole("superadmin"), // sonra rol kontrolü
  (req, res) => res.json({ message: "Süper admin paneline hoş geldiniz." })
);

/* ============================================================================
 *  USERS (JWT zorunlu)
 * ===========================================================================*/
router.use("/users", authenticate);

// Listele
router.get("/users", userController.getAllUsers);

// Detay
router.get("/users/:id", userController.getUserById);

// Güncelle
router.put("/users/:id", userController.updateUser);

// Sil
router.delete("/users/:id", userController.deleteUser);

// Oluştur (istersen burada role/middleware kontrolü ekleyebilirsin)
router.post("/users", userController.createUser);
// Örn: yalnızca süperadmin olsun dersen:
// router.post("/users", requireRole("superadmin"), userController.createUser);

module.exports = router;
