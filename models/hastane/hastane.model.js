const mongoose = require("mongoose");

const hastaneSchema = new mongoose.Schema({
  lokasyon: { type: String, required: true },
  adres: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Hastane", hastaneSchema);
