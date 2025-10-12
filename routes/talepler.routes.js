// routes/talepler.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/talepler.controller");
const { authRequired } = require("../middlewares/auth");

// Spesifik yollar her zaman önce
router.get("/detail/:id([0-9a-fA-F]{24})", ctrl.getFullById);

router.post("/", ctrl.create);
router.get("/", ctrl.list);

router.get("/aracTalep",   authRequired, ctrl.aracTalep);
router.get("/taleplerim",  authRequired, ctrl.taleplerim);
router.get("/aracIsEmri",  authRequired, ctrl.aracIsEmri);

// Yalnızca geçerli ObjectId’ler eşleşir
router.get("/:id([0-9a-fA-F]{24})", ctrl.getById);
router.put("/:id([0-9a-fA-F]{24})", ctrl.updateById);
router.put("/:id([0-9a-fA-F]{24})/atama", authRequired, ctrl.assignAracSofor);
router.delete("/:id([0-9a-fA-F]{24})", ctrl.deleteById);

module.exports = router;
