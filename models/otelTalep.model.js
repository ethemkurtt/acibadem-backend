const mongoose = require("mongoose");

const otelTalepSchema = new mongoose.Schema(
  {
    adSoyad: { type: String, required: true },
    tc: { type: String },
    telefon: { type: String },
    email: { type: String, required: true },

    odemeTipi: { type: String },
    faturaBilgisi: { type: String },
    sube: { type: String },
    masrafMerkezi: { type: String },

    konaklamaTuru: { type: String, enum: ["otel", "rezidans"], required: true },

    otelId: { type: mongoose.Schema.Types.ObjectId, ref: "Otel" },
    odaSayisi: { type: Number },
    odaTipi: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

    rezidansTipi: { type: String },
    yemekTalebi: { type: String },
    yemekOgunu: { type: String },

    girisTarihi: { type: Date },
    cikisTarihi: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtelTalep", otelTalepSchema);
