const mongoose = require("mongoose");
const NotificationPersonSchema = new mongoose.Schema({
  hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
  fullName: String,
  description: String,
});

module.exports = mongoose.model("NotificationPerson", NotificationPersonSchema);
