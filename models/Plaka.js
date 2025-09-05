// models/Plaka.js
const mongoose = require("mongoose");

const plakaSchema = new mongoose.Schema(
  {
    // Excel'den gelebilir (Mongo _id değil)
    id: { type: Number, index: true },

    plaka: { type: String, required: true, trim: true, unique: true },
    bolum: { type: String, trim: true },
    marka: { type: String, trim: true },
    tip: { type: String, trim: true },

    // İstek gereği import sırasında boş
    lokasyonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lokasyon",
      default: null,
    },
    lokasyonAd: { type: String, default: "" },
    musaitlik: { type: Boolean, default: true }, // kullanılabilir mi?

    status: { type: Boolean, default: true },
  },
  { timestamps: true, id: false }
); // virtual "id" kapalı ki kendi id alanımızla çakışmasın

// NOT: Aynı index'i hem burada hem schema.index ile TANIMLAMA. (Duplicate uyarısı çıkar.)

// Normalize: plaka upper + tek boşluk + trim (save)
plakaSchema.pre("save", function (next) {
  if (this.isModified("plaka") && this.plaka) {
    this.plaka = String(this.plaka).replace(/\s+/g, " ").trim().toUpperCase();
  }
  next();
});

// Normalize: (update)
plakaSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  const set = update.$set || update;
  if (set.plaka) {
    const norm = String(set.plaka).replace(/\s+/g, " ").trim().toUpperCase();
    if (update.$set) update.$set.plaka = norm;
    else update.plaka = norm;
  }
  next();
});

module.exports = mongoose.model("Plaka", plakaSchema);
