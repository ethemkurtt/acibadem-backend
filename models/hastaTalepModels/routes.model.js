const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = mongoose;

/* ----------------- Helpers ----------------- */
const emptyToNull = (v) => (v === "" || v === undefined ? null : v);
const trimOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  return typeof v === "string" ? v.trim() || null : v;
};
const toObjectIdOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  return ObjectId.isValid(v) ? new ObjectId(v) : null;
};
const toIntOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toDateOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// Küçük/büyük harfleri normalize edip model adına çevirir
// Mevcut modeller: Lokasyon, Hastane, Havalimani, Otel (gereğine göre güncelle)
const normalizeRefModel = (v) => {
  if (!v) return null;
  const s = String(v).toLowerCase();
  if (s === "lokasyon") return "lokasyon";
  if (s === "hastane") return "hastane";
  if (s === "havalimani" || s === "havaalani") return "havalimani";
  if (s === "otel") return "otel";
  // bilinmeyen değerler null olsun ki populate/cast patlamasın
  return null;
};

/* ----------------- (Opsiyonel) File Schema ----------------- */
const FileSchema = new mongoose.Schema({
  fileName: { type: String, default: null, set: trimOrNull },
  filePath: { type: String, default: null, set: trimOrNull },
});

/* ----------------- Routes Schema ----------------- */
const RoutesSchema = new mongoose.Schema(
  {
    hastaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HastaTalep",
      default: null,
      set: toObjectIdOrNull,
    },

    pickup: {
      type: {
        type: String,
        default: null,
        set: normalizeRefModel,
        // enum koymak istersen aç:
        // enum: ["Lokasyon", "Hastane", "Havalimani", "Otel", null],
      },
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "pickup.type",
        default: null,
        set: toObjectIdOrNull,
      },
      locationName: { type: String, default: null, set: trimOrNull },
      date: { type: Date, default: null, set: toDateOrNull },
      person: { type: Number, default: null, set: toIntOrNull },
      baggage: { type: Number, default: null, set: toIntOrNull },
      flightCode: { type: String, default: null, set: trimOrNull },
      departure_date: { type: Date, default: null, set: toDateOrNull },
      arrival_date: { type: Date, default: null, set: toDateOrNull },
      ticketPath: { type: String, default: null, set: trimOrNull },
      passportPath: { type: String, default: null, set: trimOrNull },

      il_adi: { type: String, default: null, set: trimOrNull },
      manuelLocation: { type: String, default: null, set: trimOrNull },
      ulke_kodu: { type: String, default: "TR", set: trimOrNull },
      ilce_adi: { type: String, default: null, set: trimOrNull },
      il_kodu: { type: String, default: null, set: trimOrNull },
      ilce_kodu: { type: String, default: null, set: trimOrNull },
    },

    drop: {
      type: {
        type: String,
        default: null,
        set: normalizeRefModel,
        // enum: ["Lokasyon", "Hastane", "Havalimani", "Otel", null],
      },
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "drop.type",
        default: null,
        set: toObjectIdOrNull,
      },
      locationName: { type: String, default: null, set: trimOrNull },
      date: { type: Date, default: null, set: toDateOrNull },
      person: { type: Number, default: null, set: toIntOrNull },
      baggage: { type: Number, default: null, set: toIntOrNull },
      flightCode: { type: String, default: null, set: trimOrNull },
      departure_date: { type: Date, default: null, set: toDateOrNull },
      arrival_date: { type: Date, default: null, set: toDateOrNull },
      ticketPath: { type: String, default: null, set: trimOrNull },
      passportPath: { type: String, default: null, set: trimOrNull },

      il_adi: { type: String, default: null, set: trimOrNull },
      manuelLocation: { type: String, default: null, set: trimOrNull },
      ulke_kodu: { type: String, default: "TR", set: trimOrNull },
      ilce_adi: { type: String, default: null, set: trimOrNull },
      il_kodu: { type: String, default: null, set: trimOrNull },
      ilce_kodu: { type: String, default: null, set: trimOrNull },
    },
  },
  {
    timestamps: true,
    minimize: false,
    strict: true,
  }
);

/* ----------------- Faydalı index'ler (opsiyonel) ----------------- */
// Pickup/drop tarihleri üzerinde sorgu yapıyorsan:
RoutesSchema.index({ "pickup.date": 1 });
RoutesSchema.index({ "drop.date": 1 });
// Hasta bazlı aramalar:
RoutesSchema.index({ hastaId: 1 });

module.exports = mongoose.model("Routes", RoutesSchema);
