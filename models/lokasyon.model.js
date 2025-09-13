const mongoose = require("mongoose");

const lokasyonSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true, trim: true },

  // Şehir bilgileri (opsiyonel)
  sehirId:   { type: Number, min: 1, index: true, default: null },
  sehirName: { type: String, trim: true, default: "" }
}, { timestamps: true });

// (Opsiyonel) Sehir koleksiyonundan otomatik doldurma
lokasyonSchema.pre("save", async function(next) {
  // sehirId verildiyse ve sehirName boşsa doldur
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

module.exports = mongoose.model("Lokasyon", lokasyonSchema);
