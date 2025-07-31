const express = require("express");
const router = express.Router();
const departmanController = require("../controllers/departman.controller");

router.post("/import", departmanController.importDepartmanlar);
router.get("/", departmanController.getAllDepartmanlar);
router.get("/:id", departmanController.getDepartmanById);
router.post("/", departmanController.createDepartman);
router.put("/:id", departmanController.updateDepartman);
router.delete("/:id", departmanController.deleteDepartman);
router.delete("/", departmanController.deleteAllDepartmanlar);

module.exports = router;
