// models/Hastane.js
const mongoose = require("mongoose");

const hastaneSchema = new mongoose.Schema(
  {
    lokasyon: { type: String, required: true },
    adres: { type: String, required: true },

    // Şehir bilgileri
    il_kodu: { type: String, default: "" },
    ilce_kodu: { type: String, default: "" },
    kordinat: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hastane", hastaneSchema);
