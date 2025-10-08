const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/misafirTalepDetay.controller");

// Tek başına misafir detay CRUD
router.post("/", ctrl.create);
router.get("/by-talep/:talepId", ctrl.getByTalepId);
router.put("/by-talep/:talepId", ctrl.updateByTalepId);
router.delete("/by-talep/:talepId", ctrl.deleteByTalepId);

// Birleştirilmiş (Talepler + MisafirDetay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
