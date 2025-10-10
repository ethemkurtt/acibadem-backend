// models/Hastane.js
const mongoose = require("mongoose");

const hastaneSchema = new mongoose.Schema({
  lokasyon: { type: String, required: true },
  adres: { type: String, required: true },

  // Şehir bilgileri
  il_kodu:   { type: string,default:"" }, // örn: 34
  ilce_kodu: { type: string,default:""}           // örn: "İstanbul"
}, { timestamps: true });



module.exports = mongoose.model("Hastane", hastaneSchema);
