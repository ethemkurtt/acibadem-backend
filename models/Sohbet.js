const mongoose = require("mongoose");

const sohbetSchema = new mongoose.Schema(
  {
    sohbet_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    sohbet_tipi: { type: String, default: null },
    baslatan_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, _id: false } // _id otomatik gelmesin
);

module.exports = mongoose.model("Sohbet", sohbetSchema);
