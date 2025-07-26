const mongoose = require("mongoose");

const bolgeSchema = new mongoose.Schema({
  ad: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Bolge", bolgeSchema);
