// models/hastane/hastane.model.js
const mongoose = require("mongoose");

const hastaneSchema = new mongoose.Schema({
  lokasyon: { type: String, required: true },
  adres:    { type: String, required: true },
  il_kodu:  { type: String, default: "" },
  ilce_kodu:{ type: String, default: "" },
  kordinat: { type: String, default: "" }, // DİKKAT: 'kordinat'
}, { timestamps: true });

// ⚡ OPTIMIZE: İndeksler
hastaneSchema.index({ il_kodu: 1 });
hastaneSchema.index({ lokasyon: 1 });

// model cache koruması
module.exports = mongoose.models.Hastane || mongoose.model("Hastane", hastaneSchema);
