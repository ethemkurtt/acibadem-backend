const mongoose = require("mongoose");

const LokasyonDegisiklikSchema = new mongoose.Schema(
  {
    eskiLokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon" },
    yeniLokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", required: true },
    degistirenId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    degistirenAdSoyad: { type: String, required: true },
    degistirmeZamani: { type: Date, default: Date.now }
  },
  { _id: false }
);

const HastaTalepSchema = new mongoose.Schema(
  {
    requestType: { type: String, enum: ["hasta", "personel", "misafir"], required: true },
    fullName: { type: String, required: true },
    passportNo: { type: String, required: true },
    phone: { type: String, required: true },

    bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", required: true },
    language: { type: String, required: true },
    wheelchair: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

    // 🔹 Talebin güncel lokasyonu (tekil)
    lokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", required: true },

    kategori: { type: String, required: true },

    companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
    notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson" },

    arac: { type: mongoose.Schema.Types.ObjectId, ref: "Plaka", default: null },
    sofor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    atamaDurumu: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

    transferTipi: {
      type: String,
      enum: ["Normal", "Havalimanı Geliş", "Havalimanı Dönüş"],
      required: true,
    },
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
    talepEdenAdSoyad: { type: String, required: true },

    // ✅ Şoför iş akışı
    isDurumu: { type: String, enum: ["Bekliyor", "Başladı", "Tamamlandı"], default: "Bekliyor" },

    // ✅ Atamayı yapan kişi bilgileri
    atamaYapanId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    atamaYapanAdSoyad: { type: String, default: null },
    isBaslamaZamani: { type: Date },
    isBitisZamani: { type: Date },
    iptalZamani: { type: Date },
    iptalNedeni: { type: String },

    // ✅ Lokasyon değişikliği bilgileri
    lokasyonSonDegistirenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lokasyonSonDegistirenAdSoyad: { type: String, default: null },
    lokasyonSonDegistirmeZamani: { type: Date, default: null },
    lokasyonDegisiklikleri: { type: [LokasyonDegisiklikSchema], default: [] }
  },
  { timestamps: true }
);

HastaTalepSchema.index({ lokasyon: 1, atamaDurumu: 1 });
HastaTalepSchema.index({ sofor: 1, transferTarihi: 1 });

module.exports = mongoose.model("HastaTalep", HastaTalepSchema);
