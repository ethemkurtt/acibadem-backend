// models/talepler/hastaTalepDetay.model.js
const mongoose = require("mongoose");

const LokasyonDegisiklikSchema = new mongoose.Schema(
  {
    eskiLokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
    yeniLokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
    degistirenId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    degistirenAdSoyad: { type: String, default: "" },
    degistirmeZamani: { type: Date, default: null },
  },
  { _id: false }
);

const HastaTalepDetaySchema = new mongoose.Schema(
  {
    // Bu dokümanın kendi _id'si Mongoose tarafından otomatik üretilir.
    // Ana talep kaydına bire-bir bağlantı:
    talep_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Talepler",
      required: true,
      unique: true, // her talep için tek bir hasta detay kaydı
      index: true,
    },

    // Tip-özel alanlar
    bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", default: null },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", default: null },
    language: { type: String, default: "" },
    wheelchair: { type: String, enum: ["Evet", "Hayır"], default: null },

    kategori: { type: String, default: "" },

    companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
    notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson", default: null },

    // Dönüş bilgileri ve sayılar
    donusTarihi: { type: Date, default: null },
    donusSaati: { type: String, default: "" },
    refakatciSayisi: { type: Number, default: null },
    bagajSayisi: { type: Number, default: null },

    // Açıklama/ek notlar
    aciklama: { type: String, default: "" },

    // İş akışı zaman damgaları
    isBaslamaZamani: { type: Date, default: null },
    isBitisZamani: { type: Date, default: null },
    iptalZamani: { type: Date, default: null },
    iptalNedeni: { type: String, default: "" },

    // Lokasyon değişiklik log’u (opsiyonel)
    lokasyonDegisiklikleri: { type: [LokasyonDegisiklikSchema], default: [] },
  },
  {
    timestamps: true,
    minimize: false,
    strict: true,
  }
);

// Faydalı indeksler
HastaTalepDetaySchema.index({ kategori: 1 });
HastaTalepDetaySchema.index({ language: 1 });
HastaTalepDetaySchema.index({ "lokasyonDegisiklikleri.yeniLokasyon": 1 });

module.exports = mongoose.model("HastaTalepDetay", HastaTalepDetaySchema);
