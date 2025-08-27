// models/Plaka.js
const mongoose = require("mongoose");

const plakaSchema = new mongoose.Schema({
  // Excel'den gelecek "id" (Mongo'nun _id'si değil)
  id:         { type: Number, index: true },

  plaka:      { type: String, required: true, trim: true, unique: true },
  bolum:      { type: String, trim: true },
  marka:      { type: String, trim: true },
  tip:        { type: String, trim: true },

  // İstek gereği import'ta boş kalacak
  lokasyonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
  lokasyonAd: { type: String, default: "" },

  // Boolean
  status:     { type: Boolean, default: true }
}, { timestamps: true, id: false }); // <- virtual id kapalı

plakaSchema.index({ plaka: 1 }, { unique: true });

// Normalize: plaka upper+trim
plakaSchema.pre("save", function(next) {
  if (this.isModified("plaka") && this.plaka) {
    this.plaka = String(this.plaka).replace(/\s+/g, " ").trim().toUpperCase();
  }
  next();
});

plakaSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate() || {};
  const $set = update.$set || update;
  if ($set.plaka) {
    const norm = String($set.plaka).replace(/\s+/g, " ").trim().toUpperCase();
    if (update.$set) update.$set.plaka = norm; else update.plaka = norm;
  }
  next();
});

module.exports = mongoose.model("Plaka", plakaSchema);
