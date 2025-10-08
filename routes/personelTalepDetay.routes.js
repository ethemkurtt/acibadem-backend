// routes/personelTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/personelTalepDetay.controller");

// debug (geçici): hangi route'a düştüğünü gör
// router.use((req, _res, next) => { console.log("[personel-detay]", req.method, req.originalUrl); next(); });

// Tek başına personel detay CRUD
router.post("/", ctrl.create);
router.get("/by-talep/:talepId", ctrl.getByTalepId);
router.put("/by-talep/:talepId", ctrl.updateByTalepId);
router.delete("/by-talep/:talepId", ctrl.deleteByTalepId);

// Birleştirilmiş (Talepler + PersonelDetay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
