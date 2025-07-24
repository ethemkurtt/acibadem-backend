const mongoose = require("mongoose");

const ulkeSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Ulke", ulkeSchema);
