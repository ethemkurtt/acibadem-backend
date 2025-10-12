// routes/talepler.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/talepler.controller");
const { authRequired } = require("../middlewares/auth");

// Spesifikler önce
router.get("/detail/:id", ctrl.getFullById);

router.post("/", ctrl.create);
router.get("/", ctrl.list);

router.get("/aracTalep", authRequired, ctrl.aracTalep);
router.get("/taleplerim", authRequired, ctrl.taleplerim);
router.get("/aracIsEmri", authRequired, ctrl.aracIsEmri);

// Parametreli rotaları isimlendir
router.get("/id/:id", ctrl.getById);
router.put("/id/:id", ctrl.updateById);
router.put("/id/:id/atama", authRequired, ctrl.assignAracSofor);
router.delete("/id/:id", ctrl.deleteById);

module.exports = router;
