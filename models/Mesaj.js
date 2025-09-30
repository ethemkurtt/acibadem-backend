const mongoose = require("mongoose");

const mesajSchema = new mongoose.Schema(
  {
    mesaj_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    sohbet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Sohbet", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    okunma_tarihi: { type: Date, default: null }, // Eski alan (geriye uyumluluk için)
    read_at: { type: Date, default: null }, // Yeni okunma tarihi alanı
  },
  { timestamps: false }
);

module.exports = mongoose.model("Mesaj", mesajSchema);
