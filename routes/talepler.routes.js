// routes/talepler.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/talepler.controller");
const { authRequired } = require("../middlewares/auth");
const { Types } = require("mongoose");

// 1) Sadece :id içeren rotalarda çalışacak global param guard
router.param("id", (req, res, next, val) => {
  if (!Types.ObjectId.isValid(val)) {
    return res.status(400).json({ error: "Geçersiz id" });
  }
  next();
});

// 2) Spesifik rotalar önce
router.get("/detail/:id", ctrl.getFullById);

router.post("/", ctrl.create);
router.get("/", ctrl.list);

router.get("/aracTalep",   authRequired, ctrl.aracTalep);
router.get("/taleplerim",  authRequired, ctrl.taleplerim);
router.get("/aracIsEmri",  authRequired, ctrl.aracIsEmri);
router.get("/isAtamalarim",  authRequired, ctrl.isAtamalarim);
router.get("/islerim",  authRequired, ctrl.islerim);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.updateById);
router.put("/updateUetdsSeferReferansNo/:id", ctrl.updateUetdsSeferReferansNo);
router.put("/:id/atama", authRequired, ctrl.assignAracSofor);
router.delete("/:id", ctrl.deleteById);

module.exports = router;
