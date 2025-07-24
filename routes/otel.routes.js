const express = require("express");
const router = express.Router();
const {
  createOtel,
  getOteller,
  updateOtel,
  deleteOtel,
  getOtelById,
  importOtellerFromExcel,
} = require("../controllers/otel.controller");

// 📦 Excel'den tek seferlik içe aktarım
router.post("/import", importOtellerFromExcel);

// ➕ Yeni otel ekle
router.post("/", createOtel);

// 📄 Tüm otelleri getir
router.get("/", getOteller);

// 🔍 Tek otel getir
router.get("/:id", getOtelById);

// ✏️ Otel güncelle
router.put("/:id", updateOtel);

// ❌ Otel sil
router.delete("/:id", deleteOtel);

router.delete("/", async (req, res) => {
  try {
    const result = await require("../models/otel/otel.model").deleteMany({});
    res.json({
      message: "Tüm oteller silindi",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Silme işlemi başarısız", error: err.message });
  }
});

module.exports = router;
