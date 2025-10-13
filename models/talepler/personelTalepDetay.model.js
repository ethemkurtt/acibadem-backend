// models/talepler/personelTalepDetay.model.js
const mongoose = require("mongoose");

/**
 * PERSONEL tipine özgü alanlar.
 * Tüm alanlar opsiyonel ve boş bırakılabilir.
 * talep_id: varsa Talepler'e bire-bir; yoksa boş kalabilir.
 */
const PersonelTalepDetaySchema = new mongoose.Schema(
  {
    talep_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Talepler",
      default: null,
      index: true,
    },

    // Tip-özel alanlar (hepsi opsiyonel)
    email: { type: String, default: "" },
    departman: { type: String, default: "" },
    aciklama: { type: String, default: "" },

    companions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Companions",
        default: undefined,
      },
    ],

    soforDurumu: {
      type: String,
      enum: ["Şoförlü", "Şoförsüz"],
      default: null,
    },

    alinacakYer: { type: String, default: "" },
    birakilacakYer: { type: String, default: "" },
    alinacakTarih: { type: Date, default: null },
    birakilacakTarih: { type: Date, default: null },

    alinacak_il_kodu: { type: String, default: "" },
    alinacak_ilce_kodu: { type: String, default: "" },
    birakilacak_il_kodu: { type: String, default: "" },
    birakilacak_ilce_kodu: { type: String, default: "" },

    alinacak_aciklama: { type: String, default: "" },
    birakilacak_aciklama: { type: String, default: "" },

    birakilacak_kisi_sayisi: { type: String, default: "" },
    alinacak_kisi_sayisi: { type: String, default: "" },
  },
  {
    timestamps: true,
    minimize: false,
    strict: true,
  }
);

/**
 * talep_id varsa benzersiz olsun; yoksa (null/eksik) dayatma yapmasın.
 */
PersonelTalepDetaySchema.index(
  { talep_id: 1 },
  { unique: true, partialFilterExpression: { talep_id: { $type: "objectId" } } }
);

// Faydalı opsiyonel indeksler
PersonelTalepDetaySchema.index({ departman: 1 });
PersonelTalepDetaySchema.index({ soforDurumu: 1 });

module.exports = mongoose.model("PersonelTalepDetay", PersonelTalepDetaySchema);
