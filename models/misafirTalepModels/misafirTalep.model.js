// models/misafirTalep.model.js
const mongoose = require("mongoose");

const misafirYolcuSchema = new mongoose.Schema({
  adSoyad: { type: String, required: true },
  tcPasaport: { type: String, required: true },
  telefon: { type: String, required: true },
});

const misafirRouteSchema = new mongoose.Schema({
  pickup: {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    ticket: { type: String },
    passport: { type: String }, // diziyi string birleştirme şeklinde saklıyoruz
  },
  drop: {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    ticket: { type: String },
    passport: { type: String },
  },
});

const misafirTalepSchema = new mongoose.Schema(
  {
    misafir_lokasyon: { type: String, required: true },
    misafir_adSoyad: { type: String, required: true },
    misafir_tcPasaport: { type: String, required: true },
    misafir_gsm: { type: String, required: true },
    misafir_bolge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bolge",
      required: true,
    },
    misafir_ulke: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ulke",
      required: true,
    },
    misafir_language: { type: String },
    misafir_sandalye: { type: String, enum: ["Evet", "Hayır"] },
    misafir_yolcular: [misafirYolcuSchema],
    misafir_routes: [misafirRouteSchema],
    misafir_aciklama: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MisafirTalep", misafirTalepSchema);
