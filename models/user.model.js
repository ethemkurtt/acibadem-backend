// models/user.model.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    password:    { type: String, required: true },

    // Mevcut alanlar (korunur)
    role:        { type: String, required: true },          // backward-compat
    access:      { type: [Number], default: [] },           // eski numerik erişimler (opsiyonel)

    // Çoklu rol / string izin override (mevcut kurgun)
    roles:       { type: [String], default: [] },           // ["Admin","Operasyon",...]
    perms:       { type: [String], default: [] },           // ["hastane:list", "arac:export", ...]

    // 🔹 Yeni: Sayfa-bazlı izinler (page -> actions[])
    // Örn: { hastane: ["view","create","update"], sofor: ["view"] }
    permissions: {
      type: Map,
      of: {
        type: [String],
        validate: {
          validator: (arr) => (Array.isArray(arr) && arr.every(a =>
            ["view","create","update","delete"].includes(String(a).toLowerCase())
          )),
          message: "permissions.* sadece 'view','create','update','delete' olabilir."
        },
        default: []
      },
      default: {}
    },

    // ABAC / kapsam alanları (opsiyonel)
    locations:   { type: [String], default: [] },           // örn. ["ACB-KOCAELI", "ACB-ATASEHIR"]

    tc:          { type: String, default: null },

    departman:   { type: mongoose.Schema.Types.ObjectId, ref: "Departman", default: null },
    lokasyon:    { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon",  default: null },
    bolge:       { type: mongoose.Schema.Types.ObjectId, ref: "Bolge",     default: null },
    ulke:        { type: mongoose.Schema.Types.ObjectId, ref: "Ulke",      default: null },

    telefon:     { type: String, default: null },
    mail:        { type: String, default: null },
    dogumTarihi: { type: Date,   default: null },
    cinsiyet:    { type: String, enum: ["Erkek", "Kadın", "Diğer"], default: null },
    ehliyet:     { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Map alanını JSON'da düz objeye çevir (frontend kullanımını kolaylaştırır)
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (doc, ret) {
  if (ret.permissions instanceof Map) {
    ret.permissions = Object.fromEntries(ret.permissions);
  }
  return ret;
};

module.exports = mongoose.model("User", userSchema);
