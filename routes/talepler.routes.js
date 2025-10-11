// routes/talepler.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/talepler.controller");
const { authRequired } = require("../middlewares/auth");
router.get("/detail/:id", ctrl.getFullById);   // <- YENİ
// Ortak talepler

router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/aracTalep", authRequired,ctrl.aracTalep);
router.get("/aracIsEmri", authRequired,ctrl.aracIsEmri);
router.get("/:id", ctrl.getById);

router.put("/:id", ctrl.updateById);
router.put("/:id/atama", authRequired,ctrl.assignAracSofor);
router.delete("/:id", ctrl.deleteById);

module.exports = router;
