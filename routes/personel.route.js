const express = require("express");
const router = express.Router();
const personelTalepController = require("../controllers/personelTalep.controller");

router.post("/personel-talep", personelTalepController.createPersonelTalep);
router.get("/personel-talep", personelTalepController.getAllPersonelTalepleri);

module.exports = router;
