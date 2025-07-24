const mongoose = require("mongoose");
const CompanionsSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  fullName: String,
  passportNo: String,
});

module.exports = mongoose.model("Companions", CompanionsSchema);
