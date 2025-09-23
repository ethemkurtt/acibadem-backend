const mongoose = require("mongoose");

const sohbetKisileriSchema = new mongoose.Schema(
  {
    sohbet_kisileri_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    sohbet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sohbet",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joined_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = mongoose.model("SohbetKisileri", sohbetKisileriSchema);
