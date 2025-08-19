const mongoose = require('mongoose');

const AltTurSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    name_lc: { type: String, required: true, trim: true }, // case-insensitive kontrol için
  },
  { timestamps: true, _id: true }
);

const TalepTipiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    name_lc: { type: String, required: true, trim: true, unique: true }, // global benzersiz (lowercase)
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
    altTurler: { type: [AltTurSchema], default: [] }, // gömülü alt türler
  },
  { timestamps: true }
);

// name_lc’yi otomatik doldur
TalepTipiSchema.pre('validate', function (next) {
  if (this.name) this.name_lc = this.name.toLowerCase();
  next();
});

// Alt tür push ederken name_lc’yi set et
AltTurSchema.pre('validate', function (next) {
  if (this.name) this.name_lc = this.name.toLowerCase();
  next();
});

module.exports = mongoose.model('TalepTipi', TalepTipiSchema);
