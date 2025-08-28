const express = require("express");
const router = express.Router();
const { authRequired: authenticate } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/authz");

const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

/* PUBLIC (JWT yok) */
router.post("/login", authController.login);
router.post("/auth/forgot",       authController.forgotPassword);
router.get ("/auth/reset/verify", authController.verifyResetToken);
router.post("/auth/reset",        authController.resetPassword);

/* PROTECTED (JWT zorunlu) */
router.get("/me", authenticate, authController.getMe);

router.use("/users", authenticate);
router.get("/users",      userController.getAllUsers);
router.get("/users/:id",  userController.getUserById);
router.put("/users/:id",  userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.post("/users",     userController.createUser);

router.get(
  "/admin/panel",
  authenticate,
  requireRole("superadmin"),
  (req, res) => res.json({ message: "Süper admin paneline hoş geldiniz." })
);

module.exports = router;