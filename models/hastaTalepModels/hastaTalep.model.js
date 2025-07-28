const mongoose = require("mongoose");

const HastaTalepSchema = new mongoose.Schema({
  requestType: { type: String, enum: ["hasta", "personel", "misafir"], required: true },
  fullName: { type: String, required: true },
  passportNo: { type: String, required: true },
  phone: { type: String, required: true },

  bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", required: true },
  country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", required: true },
  language: { type: String, required: true },
  wheelchair: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

  lokasyon: { type: String, required: true },
  kategori: { type: String, required: true },

  companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
  notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson" }
}, { timestamps: true });

module.exports = mongoose.model("HastaTalep", HastaTalepSchema);
