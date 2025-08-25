// routes/auth.route.js
const express = require("express");
const router = express.Router();

// Auth middleware: auth.js içinde exports.authRequired var.
// Bunu authenticate adıyla alias'lıyoruz ki mevcut isimlendirme korunabilsin.
const { authRequired: authenticate } = require("../middlewares/auth");

// Rol kontrolü (factory olmalı: requireRole("role") => (req,res,next) => ...)
const { requireRole } = require("../middlewares/authz");

// Eğer ayrı bir isSuperAdmin middleware'in varsa kullanmak istersen:
// const isSuperAdmin = require("../middlewares/isSuperAdmin");

const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

// ================== Giriş ==================
router.post("/login", authController.login);

// ================== Süperadmin Panel Örneği ==================
router.get(
  "/admin/panel",
  authenticate,                 // önce JWT
  requireRole("superadmin"),    // sonra rol kontrolü
  (req, res) => res.json({ message: "Süper admin paneline hoş geldiniz." })
);

// ================== Kullanıcı CRUD ==================
// Kendi profilini getir (JWT zorunlu)
router.get("/me", authenticate, authController.getMe);

// /users altındaki tüm rotalar için JWT zorunlu
router.use("/users", authenticate);

// Listele
router.get("/users", userController.getAllUsers);

// Detay
router.get("/users/:id", userController.getUserById);

// Güncelle
router.put("/users/:id", userController.updateUser);

// Sil
router.delete("/users/:id", userController.deleteUser);

// Oluştur (yalnızca superadmin)
router.post("/users", requireRole("superadmin"), userController.createUser);
// Alternatif: eğer ayrı bir isSuperAdmin middleware'in varsa üstteki satırı şu şekilde de yazabilirsin:
// router.post("/users", isSuperAdmin, userController.createUser);

module.exports = router;
