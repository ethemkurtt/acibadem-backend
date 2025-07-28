const mongoose = require("mongoose");

const NotificationPersonSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  fullName: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("NotificationPerson", NotificationPersonSchema);
