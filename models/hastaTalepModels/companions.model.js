const mongoose = require("mongoose");

const CompanionsSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  fullName: { type: String, required: true },
  passportNo: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Companions", CompanionsSchema);
