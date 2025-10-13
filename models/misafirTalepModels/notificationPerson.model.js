// src/models/misafirTalepModels/notificationPerson.model.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    misafirId: { type: mongoose.Schema.Types.ObjectId, ref: "MisafirTalep", required: true },
    fullName: { type: String, required: true },
    phone: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MisafirNotificationPerson
  ? mongoose.model("MisafirNotificationPerson")
  : mongoose.model("MisafirNotificationPerson", schema);
