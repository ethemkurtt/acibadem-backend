const mongoose = require("mongoose");

const HastaTalepSchema = new mongoose.Schema({
  requestType: { type: String, enum: ["hasta", "personel", "misafir"], required: true },
  fullName: { type: String, required: true },
  passportNo: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", required: true }, // ✅ artık ID geldiği için ObjectId olarak tutulmalı
  language: { type: String, required: true },
  wheelchair: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

  lokasyon: { type: String, required: true },
  kategori: { type: String, required: true },

  transferType: { type: String, enum: ["havalimani", "guzergah"], required: true },
  flightCode: { type: String },

  gelisHavalimani: { type: mongoose.Schema.Types.ObjectId, ref: "Havalimani" }, // ✅
  kalkisSaati: { type: Date },
  inisSaati: { type: Date },
  baggageCount: { type: Number },

  donusHavalimani: { type: mongoose.Schema.Types.ObjectId, ref: "Havalimani" }, // ✅
  donusKalkisSaati: { type: Date },
  donusInisSaati: { type: Date },
  donusBaggageCount: { type: Number },

  documents: [{ type: String }],

  companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
  notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson" },
}, { timestamps: true });

module.exports = mongoose.model("HastaTalep", HastaTalepSchema);
