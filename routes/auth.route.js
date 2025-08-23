// routes/auth.route.js
const express = require("express");
const router = express.Router();

// ✅ Doğru importlar
const { authenticate } = require("../middlewares/auth");     // JWT doğrulayan middleware'in
const { requireRole }   = require("../middlewares/authz");   // RBAC (role) kontrolü
const isSuperAdmin      = require("../middlewares/isSuperAdmin");

const authController    = require("../controllers/auth.controller");
const userController    = require("../controllers/user.controller");

// ================== Giriş ==================
router.post("/login", authController.login);

// ================== Süperadmin Panel Örneği ==================
router.get(
  "/admin/panel",
  authenticate,
  requireRole("superadmin"),     // <-- artık middlewares/authz.js'den geliyor
  (req, res) => {
    res.json({ message: "Süper admin paneline hoş geldiniz." });
  }
);

// ================== Kullanıcı CRUD ==================
router.use("/users", authenticate);          // tüm /users endpoint'leri oturum ister
router.get("/me", authController.getMe);     // getMe doğrudan authController'daydı

router.get("/users",     userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// sadece superadmin kullanıcı oluşturabilsin istiyorsan:
router.post("/users", authenticate, requireRole("superadmin"), userController.createUser);
// alternatif: isSuperAdmin middleware'in varsa yukarıdaki satır yerine şunu kullan:
// router.post("/users", isSuperAdmin, userController.createUser);

module.exports = router;
