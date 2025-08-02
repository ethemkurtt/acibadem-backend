const express = require("express");
const router = express.Router();

const { authenticate, requireRole } = require("../middlewares/auth");
const isSuperAdmin = require("../middlewares/isSuperAdmin");
const { getMe } = require("../controllers/auth.controller");

const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

// ================== Giriş ==================
router.post("/login", authController.login);

// ================== Süperadmin Panel Örneği ==================
router.get(
  "/admin/panel",
  authenticate,
  requireRole("superadmin"),
  (req, res) => {
    res.json({ message: "Süper admin paneline hoş geldiniz." });
  }
);

// ================== Kullanıcı CRUD ==================
router.use("/users", authenticate); // tüm /users endpoint'leri oturum ister
router.get("/me", getMe);
router.get("/users", userController.getAllUsers);            
router.get("/users/:id", userController.getUserById);         
router.put("/users/:id", userController.updateUser);           
router.delete("/users/:id", userController.deleteUser);        
router.post("/users", isSuperAdmin, userController.createUser); 
module.exports = router;