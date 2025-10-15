// routes/digerTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/digerTalepDetay.controller");

// Tek başına detay CRUD
router.post("/", ctrl.create);
router.get("/by-talep/:talepId", ctrl.getByTalepId);
router.put("/combined/:talepId", ctrl.updateByTalepId);
router.delete("/by-talep/:talepId", ctrl.deleteByTalepId);

// Birleştirilmiş (Talepler + DigerDetay)
router.post("/combined", ctrl.createCombined);

module.exports = router;
