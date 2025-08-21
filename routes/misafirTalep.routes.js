// src/routes/misafirTalep.routes.js
const express = require("express");
const router = express.Router();
const {
  createMisafirTalep,
  getAllMisafirTalepleri,
  getMisafirTalepById,
  updateMisafirTalep,
  deleteMisafirTalep,
} = require("../controllers/misafirTalep.controller");

router.post("/", createMisafirTalep);
router.get("/", getAllMisafirTalepleri);
router.get("/:id", getMisafirTalepById);
router.put("/:id", updateMisafirTalep);
router.delete("/:id", deleteMisafirTalep);

module.exports = router;
