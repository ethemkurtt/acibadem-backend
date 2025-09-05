const mongoose = require("mongoose");

const HastaTalepSchema = new mongoose.Schema({
  requestType: { type: String, enum: ["hasta", "personel", "misafir"], required: true },
  fullName: { type: String, required: true },
  passportNo: { type: String, required: true },
  phone: { type: String, required: true },

  bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", required: true },
  country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", required: true },
  language: { type: String, required: true },
  wheelchair: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

  lokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", required: true },
  kategori: { type: String, required: true },

  companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
  notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson" },

  arac: { type: mongoose.Schema.Types.ObjectId, ref: "Plaka", default: null },
  sofor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  atamaDurumu: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

  transferTipi: { type: String, enum: ["Normal", "Havalimanı Geliş", "Havalimanı Dönüş"], required: true },
  transferTarihi: { type: Date, required: true },
  transferSaati: { type: String },
  donusTarihi: { type: Date },
  donusSaati: { type: String },

  refakatciSayisi: { type: Number, default: 0 },
  bagajSayisi: { type: Number, default: 0 },

  aciklama: { type: String },
  talepDurumu: { type: String, enum: ["Bekliyor", "Onaylandı", "İptal"], default: "Bekliyor" },

  // ✅ Talebi oluşturan kişi bilgileri
  talepEdenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  talepEdenAdSoyad: { type: String, required: true }

}, { timestamps: true });

module.exports = mongoose.model("HastaTalep", HastaTalepSchema);
