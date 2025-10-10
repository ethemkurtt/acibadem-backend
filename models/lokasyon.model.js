const mongoose = require("mongoose");

const lokasyonSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true, trim: true },

  // Şehir bilgileri (opsiyonel)
  ilce_kodu:   { type: String, default: "" },
  il_kodu: { type: String , default: "" }
}, { timestamps: true });



module.exports = mongoose.model("Lokasyon", lokasyonSchema);
