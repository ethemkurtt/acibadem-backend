const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/misafirTalepDetay.controller");

// Tek başına misafir detay CRUD
router.post("/", ctrl.create);
router.get("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.getByTalepId);
router.put("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.updateByTalepId);
router.delete("/by-talep/:talepId([0-9a-fA-F]{24})", ctrl.deleteByTalepId);

// Birleştirilmiş (Talepler + MisafirDetay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
