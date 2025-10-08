// routes/talepler.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/talepler.controller");
// Ortak talepler
router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);

router.put("/:id", ctrl.updateById);
router.delete("/:id", ctrl.deleteById);

module.exports = router;
