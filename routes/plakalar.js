// routes/plakalar.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/plaka.controller");

router.post("/import", ctrl.importPlakalar);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id", ctrl.patch);
router.delete("/:id", ctrl.remove);

module.exports = router;
