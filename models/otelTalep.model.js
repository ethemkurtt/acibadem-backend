const mongoose = require("mongoose");

const OtelTalepSchema = new mongoose.Schema(
  {
    talepTipi: { type: String, enum: ["Çalışan", "Hasta", "Misafir"], required: true },
    otel: { type: String, required: true },
    odaSayisi: { type: Number, required: true },
    odaTipi: { type: String, enum: ["SNG", "DBL", "TRP", "Rezidans"], required: true },
    rezidansTipi: { type: String, enum: ["1+0", "1+1", "2+1"] },
    yemekTalep: { type: String, enum: ["Sadece Oda", "Kahvaltı Dahil", "Yemek Dahil"] },
    yemekOgunu: { type: String, enum: ["Öğlen", "Akşam", "Öğlen-Akşam"] },
    girisTarihi: { type: Date, required: true },
    cikisTarihi: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtelTalep", OtelTalepSchema);
