// models/user.model.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },

  // Mevcut alanlar (korunur)
  role:        { type: String, required: true },       // backward-compat
  access:      { type: [Number], default: [] },        // eski numerik erişimler (opsiyonel kullanım)

  // 🔹 Yeni RBAC alanları
  roles:       { type: [String], default: [] },        // çoklu rol desteği: ["Admin","Operasyon",...]
  perms:       { type: [String], default: [] },        // string izin override’ları: ["hastane:list", ...]
  locations:   { type: [String], default: [] },        // ABAC için opsiyonel (örn. hastane kodu)

  tc:          { type: String, default: null },

  departman:   { type: mongoose.Schema.Types.ObjectId, ref: "Departman", default: null },
  lokasyon:    { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon",  default: null },
  bolge:       { type: mongoose.Schema.Types.ObjectId, ref: "Bolge",     default: null },
  ulke:        { type: mongoose.Schema.Types.ObjectId, ref: "Ulke",      default: null },

  telefon:     { type: String, default: null },
  mail:        { type: String, default: null },
  dogumTarihi: { type: Date,   default: null },
  cinsiyet:    { type: String, enum: ["Erkek", "Kadın", "Diğer"], default: null },
  ehliyet:     { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
