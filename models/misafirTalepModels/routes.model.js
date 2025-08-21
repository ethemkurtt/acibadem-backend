// src/models/misafirTalepModels/routes.model.js
const mongoose = require("mongoose");

const SideSchema = new mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
    locationName: { type: String, default: null },
    date: { type: Date, default: null },
    person: { type: Number, default: 0 },
    baggage: { type: Number, default: 0 },
    flightCode: { type: String, default: null },
    departure: { type: Date, default: null },
    ticket: { type: String, default: null },   // dosya yolu/string
    passport: { type: String, default: null }, // "A, B, C" gibi
    type: { type: String, enum: ["otel", "hastane", "havalimani", "diger"], default: null },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    misafirId: { type: mongoose.Schema.Types.ObjectId, ref: "MisafirTalep", required: true },
    pickup: { type: SideSchema, default: null },
    drop: { type: SideSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MisafirRoutes
  ? mongoose.model("MisafirRoutes")
  : mongoose.model("MisafirRoutes", schema);
