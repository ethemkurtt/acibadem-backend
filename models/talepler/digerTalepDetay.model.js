// models/talepler/digerTalepDetay.model.js
const mongoose = require("mongoose");

const toNullIfEmpty = (v) =>
  typeof v === "string" && v.trim() === "" ? null : v;

/**
 * DİĞER tipine özgü alanlar (tamamı opsiyonel).
 * Ortak alanlar (lokasyon, kategori, arac, sofor, atamaDurumu,
 * transferTarihi/transferSaati, talepDurumu, talepEdenId, isDurumu, description vs.)
 * Talepler tablosunda tutulur.
 */
const DigerTalepDetaySchema = new mongoose.Schema(
  {
    talep_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Talepler",
      default: null,
      index: true,
    },

   
    talep_tipi: { type: String, set: toNullIfEmpty, default: null },        // "Evrak" vb.
    talep_tipi_diger: { type: String, set: toNullIfEmpty, default: null },
    alt_tip: { type: String, set: toNullIfEmpty, default: null },           // "Banka" vb.
    alt_tip_diger: { type: String, set: toNullIfEmpty, default: null },
    talep_aciklama: { type: String, set: toNullIfEmpty, default: null },
    nereden: { type: String, set: toNullIfEmpty, default: null },
    nereye: { type: String, set: toNullIfEmpty, default: null },
    transferTarihi: { type: Date, default: null },
  },
  {
    timestamps: true,
    minimize: false,
    strict: true,
  }
);

// talep_id set edilirse tekil; boş/null ise kısıtlama yok
DigerTalepDetaySchema.index(
  { talep_id: 1 },
  { unique: true, partialFilterExpression: { talep_id: { $type: "objectId" } } }
);

// (Opsiyonel) sorgu kolaylığı için indeksler
DigerTalepDetaySchema.index({ talep_tipi: 1, alt_tip: 1 });

module.exports = mongoose.model("DigerTalepDetay", DigerTalepDetaySchema);
