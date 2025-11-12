// models/Havalimani.js
const mongoose = require("mongoose");

const havalimaniSchema = new mongoose.Schema(
  {
    adi: { type: String, required: true },

    il_kodu: { type: String, default: "" }, // örn: 34
    ilce_kodu: { type: String, default: "" },
    kordinat: { type: String, default: "" }, // örn: "İstanbul"
  },
  { timestamps: true }
);

// ⚡ OPTIMIZE: İndeksler
havalimaniSchema.index({ adi: 1 });
havalimaniSchema.index({ il_kodu: 1 });

module.exports = mongoose.model("Havalimani", havalimaniSchema);
