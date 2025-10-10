// routes/hastaTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const validateObjectId = require("../middlewares/validateObjectId");
const ctrl = require("../controllers/hastaTalepDetay.controller");


// router.get("/by-talep/:talepId", ctrl.getByTalepId);
// router.put("/by-talep/:talepId", ctrl.updateByTalepId);
// router.delete("/by-talep/:talepId", ctrl.deleteByTalepId);
router.put("/combined/:talepId", validateObjectId("talepId"), ctrl.updateCombined);
// Birleştirilmiş (talepler + detay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
