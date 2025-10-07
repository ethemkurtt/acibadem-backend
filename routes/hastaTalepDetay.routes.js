// routes/hastaTalepDetay.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hastaTalepDetay.controller");

// Tek başına detay CRUD
router.post("/", ctrl.createCombined);

// Birleştirilmiş (talepler + detay) tek endpoint
router.post("/combined", ctrl.createCombined);

module.exports = router;
