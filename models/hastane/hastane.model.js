// models/Hastane.js
const mongoose = require("mongoose");

const hastaneSchema = new mongoose.Schema({
  lokasyon: { type: String, required: true },
  adres: { type: String, required: true },

  // Şehir bilgileri
  sehirId:   { type: Number, required: true, min: 1, index: true }, // örn: 34
  sehirName: { type: String, required: true, trim: true }           // örn: "İstanbul"
}, { timestamps: true });

// (Opsiyonel) Sehir koleksiyonundan otomatik doldurma
hastaneSchema.pre("save", async function(next) {
  if (this.isModified("sehirId") && this.sehirId && !this.sehirName) {
    try {
      const Sehir = mongoose.model("Sehir");
      const s = await Sehir.findOne({ sehirId: this.sehirId }).lean();
      if (!s) return next(new Error("Geçersiz sehirId (Sehir bulunamadı)"));
      this.sehirName = s.name;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Hastane", hastaneSchema);
