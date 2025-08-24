// routes/auth.route.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/auth");     // ✔️ doğru dosya ve ad
const { requireRole }   = require("../middlewares/authz");   // ✔️ role kontrolü buradan
const isSuperAdmin      = require("../middlewares/isSuperAdmin");

const authController    = require("../controllers/auth.controller");
const userController    = require("../controllers/user.controller");

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
router.get("/me", authenticate, authController.getMe); // me için de JWT şart

router.use("/users", authenticate);            // /users altına JWT şart
router.get("/users",       userController.getAllUsers);
router.get("/users/:id",   userController.getUserById);
router.put("/users/:id",   userController.updateUser);
router.delete("/users/:id",userController.deleteUser);

// sadece superadmin create edebilsin:
router.post("/users", userController.createUser);
// (alternatif: isSuperAdmin middleware'in varsa onunla değiştir)

module.exports = router;
