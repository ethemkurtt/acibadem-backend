const mongoose = require("mongoose");

const mesajSchema = new mongoose.Schema(
  {
    mesaj_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    sohbet_id: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    okunma_tarihi: { type: Date, default: null },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Mesaj", mesajSchema);
