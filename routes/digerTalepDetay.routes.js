// routes/digerTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/digerTalepDetay.controller");

// Tek başına detay CRUD
router.post("/", ctrl.create);
router.get("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.getByTalepId);
router.put("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.updateByTalepId);
router.delete("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.deleteByTalepId);

// Birleştirilmiş (Talepler + DigerDetay)
router.post("/combined", ctrl.createCombined);

module.exports = router;
