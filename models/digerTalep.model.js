const mongoose = require("mongoose");

const toNullIfEmpty = (v) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const DigerTalepSchema = new mongoose.Schema(
  {
    talep_tipi:       { type: String, set: toNullIfEmpty, default: null }, // "Evrak"
    talep_tipi_diger: { type: String, set: toNullIfEmpty, default: null },
    alt_tip:          { type: String, set: toNullIfEmpty, default: null }, // "Banka"
    alt_tip_diger:    { type: String, set: toNullIfEmpty, default: null },
    talep_aciklama:   { type: String, set: toNullIfEmpty, default: null },
    nereden:          { type: String, set: toNullIfEmpty, default: null },
    nereye:           { type: String, set: toNullIfEmpty, default: null },
    transfer_tarih:   { type: String, set: toNullIfEmpty, default: null }, // "YYYY-MM-DD"
    transfer_saat:    { type: String, set: toNullIfEmpty, default: null }, // "HH:mm"
    type:             { type: String, default: "diger", index: true },
  },
  { timestamps: true }
);

// Sık kullanılan alanlara index
DigerTalepSchema.index({ createdAt: -1 });
DigerTalepSchema.index({ talep_tipi: 1, alt_tip: 1 });

module.exports = mongoose.model("DigerTalep", DigerTalepSchema);
