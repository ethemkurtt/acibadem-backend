const mongoose = require("mongoose");

const ulkeSchema = new mongoose.Schema({
  ad: { type: String, required: true },
  bolgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Ulke", ulkeSchema);
