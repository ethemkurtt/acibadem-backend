const mongoose = require("mongoose");

const PersonelTalepSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ["personel"],
    default: "personel",
  },
  fullName: { type: String, required: true },
  passportNo: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  lokasyon: { type: String, required: true },
  departman: { type: String, required: true },
  soforDurumu: { type: String, enum: ["Şoförlü", "Şoförsüz"] },
  kategori: { type: String },
  transferType: { type: String, enum: ["havalimani", "guzergah"], required: true },
  flightCode: { type: String },
  gelisHavalimani: { type: mongoose.Schema.Types.ObjectId, ref: "Havalimani" },
  kalkisSaati: { type: Date },
  inisSaati: { type: Date },
  baggageCount: { type: Number },
  donusHavalimani: { type: mongoose.Schema.Types.ObjectId, ref: "Havalimani" },
  donusKalkisSaati: { type: Date },
  donusInisSaati: { type: Date },
  donusBaggageCount: { type: Number },
  aciklama: { type: String },
  companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PersonelTalep", PersonelTalepSchema);
