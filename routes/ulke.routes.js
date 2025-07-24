const express = require("express");
const router = express.Router();
const {
  importUlkeler,
  getAllUlkeler,
  deleteAllUlkeler
} = require("../controllers/ulke.controller");

router.post("/import", importUlkeler);
router.get("/", getAllUlkeler);
router.delete("/", deleteAllUlkeler);

module.exports = router;
