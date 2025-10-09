// models/talepler/talepler.model.js
const mongoose = require("mongoose");

const TaleplerSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["hasta", "personel", "misafir", "diger"],
      default: null,
    },
    fullName: { type: String, default: "" },
    passportNo: { type: String, default: "" },
    phone: { type: String, default: "" },

    // Güncel lokasyon (tekil)
    lokasyon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lokasyon",
      default: null,
    },
    kategori: { type: String, default: "" },
    // Operasyonel
    arac: { type: mongoose.Schema.Types.ObjectId, ref: "Plaka", default: null },
    sofor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    atamaDurumu: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },

    transferTarihi: { type: Date, default: null },
    transferSaati: { type: String, default: "" },

    talepDurumu: {
      type: String,
      enum: ["Bekliyor", "Onaylandı", "İptal"],
      default: null,
    },

    talepEdenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDurumu: {
      type: String,
      enum: ["Bekliyor", "Başladı", "Tamamlandı"],
      default: null,
    },

    atamaYapanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    atamaYapanAdSoyad: { type: String, default: "" },

    uetdsSeferReferansNo: { type: String, default: "" },

    lokasyonSonDegistirenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    description: { type: String, default: "" },
  },
  {
    timestamps: true,
    minimize: false,
    strict: true,
  }
);

TaleplerSchema.index({ requestType: 1, transferTarihi: 1 });
TaleplerSchema.index({ sofor: 1, transferTarihi: 1 });
TaleplerSchema.index({ lokasyon: 1, atamaDurumu: 1 });

module.exports = mongoose.model("Talepler", (TaleplersSchema = TaleplerSchema));
