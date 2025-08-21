const express = require("express");
const router = express.Router();
const {
  createDigerTalep,
  getAllDigerTalepler,
  getDigerTalepById,
  updateDigerTalep,
  deleteDigerTalep,
  deleteAllDigerTalepler, // opsiyonel
} = require("../controllers/digerTalep.controller");

router.post("/", createDigerTalep);
router.get("/", getAllDigerTalepler);
router.get("/:id", getDigerTalepById);
router.put("/:id", updateDigerTalep);
router.delete("/:id", deleteDigerTalep);

// toplu silme istersen açık bırak; istemezsen bu satırı kaldır
router.delete("/", deleteAllDigerTalepler);

module.exports = router;
