const express = require("express");
const router = express.Router();
const {
  importHastaneler,
  getAllHastaneler,
  deleteAllHastaneler,
  createHastene,
  deleteHastene,
} = require("../controllers/hastane.controller");

router.post("/import", importHastaneler);
router.post("/", createHastene);
router.get("/", getAllHastaneler);
router.delete("/", deleteAllHastaneler);
router.delete("/:id", deleteHastene);
module.exports = router;
