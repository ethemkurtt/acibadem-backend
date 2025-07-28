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
    locationId: { type: mongoose.Schema.Types.ObjectId, refPath: "pickup.type" },
    locationName: String,
    date: Date,
    person: Number,
    baggage: Number,
    flightCode: String,
    departure: Date,
    arrival: Date,
    ticket: FileSchema, // ✅ Dosya bilgisi obje
    passport: [FileSchema], // ✅ Array of objects
  },
  drop: {
    type: {
      type: String,
    },
    locationId: { type: mongoose.Schema.Types.ObjectId, refPath: "drop.type" },
    locationName: String,
    date: Date,
    person: Number,
    baggage: Number,
    flightCode: String,
    departure: Date,
    arrival: Date,
    ticket: FileSchema,
    passport: [FileSchema],
  },
});

module.exports = mongoose.model("Routes", RoutesSchema);
