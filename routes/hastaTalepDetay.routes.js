// routes/hastaTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hastaTalepDetay.controller");

// Tek başına detay CRUD
router.post("/", ctrl.createCombined);
// router.get("/by-talep/:talepId", ctrl.getByTalepId);
// router.put("/by-talep/:talepId", ctrl.updateByTalepId);
// router.delete("/by-talep/:talepId", ctrl.deleteByTalepId);

// Birleştirilmiş (talepler + detay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
