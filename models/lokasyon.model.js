const mongoose = require("mongoose");

const lokasyonSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true, trim: true },

  // Şehir bilgileri (opsiyonel)
  sehirId:   { type: Number, min: 1, index: true, default: null },
  sehirName: { type: String, trim: true, default: "" }
}, { timestamps: true });



module.exports = mongoose.model("Lokasyon", lokasyonSchema);
