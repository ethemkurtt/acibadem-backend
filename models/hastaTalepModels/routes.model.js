const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileName: String,       // Orijinal dosya adı
  filePath: String        // Kaydedilen dosyanın yolu (/uploads/tickets/abc.png)
}, { _id: false });

const LocationSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, refPath: "pickup.type" }, // otel / havalimani / hastane
  locationName: String
}, { _id: false });

const RouteDetailSchema = new mongoose.Schema({
  type: { type: String, enum: ["otel", "hastane", "havalimani"], required: true },
  location: LocationSchema,
  date: Date,
  person: Number,
  baggage: Number,
  flightCode: String,
  departure: Date,
  arrival: Date,
  ticket: FileSchema,
  passport: [FileSchema]
}, { _id: false });

const RoutesSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  pickup: RouteDetailSchema,
  drop: RouteDetailSchema
}, { timestamps: true });

module.exports = mongoose.model("Routes", RoutesSchema);
