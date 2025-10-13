const mongoose = require("mongoose");

const NotificationPersonSchema = new mongoose.Schema(
  {
    hastaId: { type: mongoose.Schema.Types.ObjectId, ref: "HastaTalep" },
    fullName: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationPerson", NotificationPersonSchema);
