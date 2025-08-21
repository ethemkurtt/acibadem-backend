// src/models/misafirTalepModels/notificationPerson.model.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    misafirId: { type: mongoose.Schema.Types.ObjectId, ref: "MisafirTalep", required: true },
    adSoyad: { type: String, required: true },
    telefon: { type: String, default: null },
    aciklama: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MisafirNotificationPerson
  ? mongoose.model("MisafirNotificationPerson")
  : mongoose.model("MisafirNotificationPerson", schema);
