const mongoose = require("mongoose");

const havalimaniSchema = new mongoose.Schema({
  adi: { type: String, required: true },
  sehir: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Havalimani", havalimaniSchema);
