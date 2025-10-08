const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileName: String,
  filePath: String,
});

const RoutesSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  pickup: {
    type: {
      type: String,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "pickup.type",
      default: null,
    },
    locationName: { type: String, default: null },
    date: Date,
    person: Number,
    baggage: Number,
    flightCode: String,
    departure: Date,
    arrival: Date,
    ticket: String,
    passport: String,

    // 🔹 Yeni eklenen alanlar
    il_adi: { type: String, default: null },
    pickupManuelLocation: { type: String, default: null },
    ulke_kodu: { type: String, default: "TR" },
    ilce_adi: { type: String, default: null },
    il_kodu: { type: String, default: null },
    ilce_kodu: { type: String, default: null },
  },
  drop: {
    type: {
      type: String,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "drop.type",
      default: null,
    },

    locationName: { type: String, default: null },
    date: Date,
    person: Number,
    baggage: Number,
    flightCode: String,
    departure: Date,
    arrival: Date,
    ticket: String,
    passport: String,

    // 🔹 Yeni eklenen alanlar
    il_adi: { type: String, default: null },
    dropManuelLocation: { type: String, default: null },
    ulke_kodu: { type: String, default: "TR" },
    ilce_adi: { type: String, default: null },
    il_kodu: { type: String, default: null },
    ilce_kodu: { type: String, default: null },
  },
});

module.exports = mongoose.model("Routes", RoutesSchema);
