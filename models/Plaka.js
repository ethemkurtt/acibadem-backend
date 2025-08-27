const mongoose = require("mongoose");

const plakaSchema = new mongoose.Schema({
  id:    { type: Number, index: true },          // Excel id (opsiyonel)
  plaka: { type: String, required: true, trim: true, unique: true },
  bolum: { type: String, trim: true },
  marka: { type: String, trim: true },
  tip:   { type: String, trim: true },

  lokasyonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
  lokasyonAd: { type: String, default: "" },

  status: { type: Boolean, default: true }
}, { timestamps: true, id: false });

// ❌ Varsa SİL: plakaSchema.index({ plaka: 1 }, { unique: true });

plakaSchema.pre("save", function(next) {
  if (this.isModified("plaka") && this.plaka) {
    this.plaka = String(this.plaka).replace(/\s+/g, " ").trim().toUpperCase();
  }
  next();
});
plakaSchema.pre("findOneAndUpdate", function(next) {
  const u = this.getUpdate() || {};
  const $ = u.$set || u;
  if ($.plaka) {
    const norm = String($.plaka).replace(/\s+/g, " ").trim().toUpperCase();
    if (u.$set) u.$set.plaka = norm; else u.plaka = norm;
  }
  next();
});

module.exports = mongoose.model("Plaka", plakaSchema);
