const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileName: { type: String, default: null },
  filePath: { type: String, default: null },
});

const RoutesSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep", default: null },

  pickup: {
    type: {
      type: String,
      default: null,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "pickup.type",
      default: null,
    },
    locationName: { type: String, default: null },
    date: { type: Date, default: null },
    person: { type: Number, default: null },
    baggage: { type: Number, default: null },
    flightCode: { type: String, default: null },
    departure: { type: Date, default: null },
    arrival: { type: Date, default: null },
    ticket: { type: String, default: null },
    passport: { type: String, default: null },

    il_adi: { type: String, default: null },
    manuelLocation: { type: String, default: null },
    ulke_kodu: { type: String, default: "TR" },
    ilce_adi: { type: String, default: null },
    il_kodu: { type: String, default: null },
    ilce_kodu: { type: String, default: null },
  },

  drop: {
    type: {
      type: String,
      default: null,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "drop.type",
      default: null,
    },
    locationName: { type: String, default: null },
    date: { type: Date, default: null },
    person: { type: Number, default: null },
    baggage: { type: Number, default: null },
    flightCode: { type: String, default: null },
    departure: { type: Date, default: null },
    arrival: { type: Date, default: null },
    ticket: { type: String, default: null },
    passport: { type: String, default: null },

    il_adi: { type: String, default: null },
    manuelLocation: { type: String, default: null },
    ulke_kodu: { type: String, default: "TR" },
    ilce_adi: { type: String, default: null },
    il_kodu: { type: String, default: null },
    ilce_kodu: { type: String, default: null },
  },
});

module.exports = mongoose.model("Routes", RoutesSchema);
