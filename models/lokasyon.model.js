const mongoose = require("mongoose");

const lokasyonSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Lokasyon", lokasyonSchema);
