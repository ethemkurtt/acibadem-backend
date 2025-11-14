const mongoose = require("mongoose");

const sohbetSchema = new mongoose.Schema(
  {
    sohbet_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    sohbet_tipi: { type: String, default: null },
    baslatan_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Başlatan kullanıcı bilgilerini de kaydet (populate başarısız olursa fallback için)
    baslatan_user_name: { type: String, required: true },
    baslatan_user_email: { type: String, required: true },
  },
  { timestamps: true } // _id otomatik eklenecek
);

// ⚡ INDEXES - Performance için
sohbetSchema.index({ baslatan_user_id: 1 }); // Başlatanın sohbetleri
sohbetSchema.index({ createdAt: -1 }); // Yeni sohbetler

module.exports = mongoose.model("Sohbet", sohbetSchema);
