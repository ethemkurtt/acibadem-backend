// src/models/misafirTalepModels/misafirTalep.model.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["hasta", "personel", "misafir"],
      default: "misafir",
      required: true,
    },

    fullName: { type: String, required: true },
    passportNo: { type: String, required: true },
    phone: { type: String, required: true },

    bolge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bolge",
      default: null,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ulke",
      default: null,
    },
    language: { type: String, default: null },
    wheelchair: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

    lokasyon: { type: String, required: true },
    kategori: { type: String, default: "Misafir" },
    aciklama: { type: String, default: null },

    companions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "MisafirCompanions" },
    ],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "MisafirRoutes" }],
    notificationPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MisafirNotificationPerson",
      default: null,
    },
    // Yeni alanlar
    arac: { type: mongoose.Schema.Types.ObjectId, ref: "Plaka", default: null },
    sofor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    atamaDurumu: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },
  },
  { timestamps: true }
);

schema.index({ createdAt: -1 });
schema.index({ fullName: 1 });

module.exports = mongoose.models.MisafirTalep
  ? mongoose.model("MisafirTalep")
  : mongoose.model("MisafirTalep", schema);
