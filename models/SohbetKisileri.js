const mongoose = require("mongoose");

const sohbetKisileriSchema = new mongoose.Schema(
  {
    sohbet_kisileri_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    sohbet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Sohbet", required: true }, // ObjectId reference
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Kullanıcı bilgilerini de kaydet (populate başarısız olursa fallback için)
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    joined_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// ⚡ INDEXES - Performance için
sohbetKisileriSchema.index({ user_id: 1 }); // Kullanıcının sohbetleri
sohbetKisileriSchema.index({ sohbet_id: 1 }); // Sohbetin katılımcıları
sohbetKisileriSchema.index({ sohbet_id: 1, user_id: 1 }, { unique: true }); // Benzersiz katılımcı

module.exports = mongoose.model("SohbetKisileri", sohbetKisileriSchema);
