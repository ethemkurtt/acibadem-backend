const express = require("express");
const router = express.Router();
const c = require("../controllers/bolgeUlke.controller");

// ✅ JSON Import
router.post("/import-json", c.importFromJson);

// ✅ Bölgeler
router.get("/bolgeler", c.getBolgeler);
router.post("/bolgeler", c.createBolge);
router.put("/bolgeler/:id", c.updateBolge);
router.delete("/bolgeler/:id", c.deleteBolge);

// ✅ Ülkeler
router.get("/ulkeler", c.getUlkeler);
router.get("/ulkeler/:id", c.getUlkeById);
router.post("/ulkeler", c.createUlke);
router.put("/ulkeler/:id", c.updateUlke);
router.delete("/ulkeler/:id", c.deleteUlke);

module.exports = router;
