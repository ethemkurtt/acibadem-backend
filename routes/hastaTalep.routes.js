// ✅ routes/hastaTalep.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const hastaTalepController = require("../controllers/hastaTalep.controller");
const { authRequired } = require("../middlewares/auth");


// Upload klasörü ve dosya ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Routes
router.post(
  "/",
  upload.fields([{ name: "documents", maxCount: 10 }]),
  hastaTalepController.createHastaTalep
);
router.get("/bekleyen",authRequired, hastaTalepController.getBekleyenTalepler);
router.get("/onaylanmis",authRequired, hastaTalepController.getOnaylanmisTalepler);
router.get("/", hastaTalepController.getAllHastaTalepleri);
router.get("/:id", hastaTalepController.getHastaTalepById);
router.get('/sofor/atamalarim', authRequired, hastaTalepController.getSoforAtamalarim);
router.get('/sofor/:id/atamalar', authRequired, hastaTalepController.getSoforAtamalariById);
router.delete("/:id", hastaTalepController.deleteHastaTalep);
router.put("/:id", hastaTalepController.updateHastaTalep);
router.put("/:id/atama", hastaTalepController.assignAracSofor);
router.put('/:id/baslat',  hastaTalepController.baslatTalep);
router.put('/:id/tamamla', hastaTalepController.tamamlaTalep);
router.put('/:id/iptal',   hastaTalepController.iptalTalep);

module.exports = router;