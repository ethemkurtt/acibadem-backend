// models/Otel.js
const mongoose = require("mongoose");

const otelSchema = new mongoose.Schema(
  {
    otelAdi: { type: String, trim: true },
    lokasyon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lokasyon",
      default: null,
    },
    rezervasyonEmail: { type: String, trim: true },
    yetkiliKisi: { type: String, trim: true },
    yetkiliIletisim: { type: String, trim: true },
    adres: { type: String, trim: true },
    firmaUnvani: { type: String, trim: true },
    vergiDairesi: { type: String, trim: true },
    vergiNo: { type: String, trim: true },

    // Yeni alanlar (hepsi opsiyonel)
    il_kodu: { type: Number, min: 1, index: true }, // örn: 34
    ilce_kodu: { type: Number, min: 1, index: true }, // örn: 3402
    kordinat: { type: String, trim: true }, // örn: "41.0082,28.9784" veya Google Maps URL
  },
  { timestamps: true }
);

// sehirId/sehirName ile ilgili hook'lar kaldırıldı

module.exports = mongoose.model("Otel", otelSchema);
