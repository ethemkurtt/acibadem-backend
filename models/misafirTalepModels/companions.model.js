// src/models/misafirTalepModels/companions.model.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    misafirId: { type: mongoose.Schema.Types.ObjectId, ref: "MisafirTalep", required: true },
    adSoyad: { type: String, required: true },
    tcPasaport: { type: String, default: null },
    telefon: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MisafirCompanions
  ? mongoose.model("MisafirCompanions")
  : mongoose.model("MisafirCompanions", schema);
