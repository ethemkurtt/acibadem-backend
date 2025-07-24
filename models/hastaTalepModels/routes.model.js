const mongoose = require("mongoose");

const RoutesSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  pickup: {
    type: { type: String },
    name: String,
    location: String, // ✅ EKLENDİ
    time: Date,
    passengerCount: Number,
    baggageCount: Number,
  },
  drop: {
    type: { type: String },
    name: String,
    location: String, // ✅ EKLENDİ
    time: Date,
  },
});

module.exports = mongoose.model("Routes", RoutesSchema);