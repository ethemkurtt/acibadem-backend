const express = require("express");
const router = express.Router();
const {
  importLokasyonlar,
  getAllLokasyonlar,
  deleteAllLokasyonlar
} = require("../controllers/lokasyon.controller");

router.post("/import", importLokasyonlar);
router.get("/", getAllLokasyonlar);
router.delete("/", deleteAllLokasyonlar);

module.exports = router;
