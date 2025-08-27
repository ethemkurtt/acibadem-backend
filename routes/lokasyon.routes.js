const express = require("express");
const router = express.Router();
const {
  importLokasyonlar,
  getAllLokasyonlar,
  deleteAllLokasyonlar,
  patchLokasyon
} = require("../controllers/lokasyon.controller");

router.post("/import", importLokasyonlar);
router.get("/", getAllLokasyonlar);
router.delete("/", deleteAllLokasyonlar);
router.patch("/:id", patchLokasyon);
module.exports = router;
