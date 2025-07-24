const mongoose = require("mongoose");

const otelSchema = new mongoose.Schema({
  otelAdi: String,
  lokasyon:String,
  rezervasyonEmail: String,
  yetkiliKisi: String,
  yetkiliIletisim: String,
  adres: String,
  firmaUnvani: String,
  vergiDairesi: String,
  vergiNo: String
}, { timestamps: true });

module.exports = mongoose.model("Otel", otelSchema);