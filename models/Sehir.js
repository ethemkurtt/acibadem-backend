// models/Sehir.js
const mongoose = require("mongoose");

const sehirSchema = new mongoose.Schema({
  sehirId: { type: Number, required: true, unique: true, min: 1 },
  name:     { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

sehirSchema.index({ sehirId: 1 }, { unique: true });
sehirSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Sehir", sehirSchema);
