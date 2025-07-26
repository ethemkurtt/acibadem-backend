const mongoose = require("mongoose");

const ulkeSchema = new mongoose.Schema({
  ad: { type: String, required: true },
  bolgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", required: true }
}, { timestamps: true });

// Aynı ülke aynı bölgede tekrar eklenmesin
ulkeSchema.index({ ad: 1, bolgeId: 1 }, { unique: true });

module.exports = mongoose.model("Ulke", ulkeSchema);
