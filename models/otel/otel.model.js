// models/Otel.js
const mongoose = require("mongoose");

const otelSchema = new mongoose.Schema({
  otelAdi: String,
  lokasyon: String,
  rezervasyonEmail: String,
  yetkiliKisi: String,
  yetkiliIletisim: String,
  adres: String,
  firmaUnvani: String,
  vergiDairesi: String,
  vergiNo: String,

  // Yeni alanlar:
  sehirId:   { type: Number, min: 1, index: true },     // örn: 34
  sehirName: { type: String, trim: true }                // örn: "İstanbul"
}, { timestamps: true });

// (Opsiyonel) sehirId -> sehirName doğrulama/otomatik doldurma
// Yoruma alırsan manuel girersin.
// Not: Döngüye girmemesi için minimal sorgu.
otelSchema.pre("save", async function(next) {
  // sehirId varsa ve sehirName boşsa otomatik doldur
  if (this.isModified("sehirId") && this.sehirId && !this.sehirName) {
    try {
      const Sehir = mongoose.model("Sehir"); // models/Sehir.js olmalı
      const s = await Sehir.findOne({ sehirId: this.sehirId }).lean();
      if (!s) return next(new Error("Geçersiz sehirId (Sehir bulunamadı)"));
      this.sehirName = s.name;
    } catch (e) {
      return next(e);
    }
  }
  next();
});

module.exports = mongoose.model("Otel", otelSchema);
