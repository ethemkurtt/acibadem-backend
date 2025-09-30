const mongoose = require("mongoose");

const sohbetKisileriSchema = new mongoose.Schema(
  {
    sohbet_kisileri_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    sohbet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Sohbet", required: true }, // ObjectId reference
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joined_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model("SohbetKisileri", sohbetKisileriSchema);
