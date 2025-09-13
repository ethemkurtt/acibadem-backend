const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    organizasyon: { type: String, required: true },
    personelGrubu: { type: String, required: true },
    roleGroupId: { type: String, required: true },

    perms: { type: [String], default: [] },

    permissions: {
      type: Map,
      of: {
        type: [String],
        validate: {
          validator: (arr) =>
            Array.isArray(arr) &&
            arr.every((a) =>
              ["view", "create", "update", "delete"].includes(
                String(a).toLowerCase()
              )
            ),
          message:
            "permissions.* sadece 'view','create','update','delete' olabilir.",
        },
        default: [],
      },
      default: {},
    },

    // ekstra string lokasyon etiketleri (opsiyonel)
    locations: { type: [String], default: [] },

    tc: { type: String, default: null },
    departman: { type: mongoose.Schema.Types.ObjectId, ref: "Departman", default: null },

    // 🔹 Çoklu lokasyon desteği
    lokasyonlar: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon" }],

    bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", default: null },
    ulke: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", default: null },
    musaitlik: { type: Boolean, default: true },
    telefon: { type: String, default: null },
    mail: { type: String, default: null },
    dogumTarihi: { type: Date, default: null },
    cinsiyet: { type: String, enum: ["Erkek", "Kadın", "Diğer"], default: null },
    ehliyet: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// Map -> düz obje
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (doc, ret) {
  if (ret.permissions instanceof Map) {
    ret.permissions = Object.fromEntries(ret.permissions);
  }
  return ret;
};

module.exports = mongoose.model("User", userSchema);
