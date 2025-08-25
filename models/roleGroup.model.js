// models/roleGroup.model.js
const mongoose = require("mongoose");

const VALID_ACTIONS = ["view", "create", "update", "delete"];

const roleGroupSchema = new mongoose.Schema({
  roleId:   { type: String, required: true, unique: true, trim: true }, // örn: "editor"
  roleName: { type: String, required: true, trim: true },               // örn: "Editör"

  // Tek bir alan: yetkiler
  // - perms: ["talepOlustur:hasta", ...] gibi kısa izinler
  // - permissions: { talepler: ["view","create"], ... } gibi sayfa-aksiyon
  yetkiler: {
    perms: { type: [String], default: [] },
    permissions: {
      type: Map,
      of: {
        type: [String],
        set: arr => Array.isArray(arr) ? arr.map(a => String(a).toLowerCase()) : [],
        validate: {
          validator: arr => Array.isArray(arr) && arr.every(a => VALID_ACTIONS.includes(a)),
          message: `permissions.* sadece '${VALID_ACTIONS.join("','")}' olabilir.`
        },
        default: []
      },
      default: {}
    }
  }
}, { timestamps: true });

roleGroupSchema.index({ roleId: 1 }, { unique: true });

// JSON'da Map → düz obje
if (!roleGroupSchema.options.toJSON) roleGroupSchema.options.toJSON = {};
roleGroupSchema.options.toJSON.transform = function (_doc, ret) {
  if (ret?.yetkiler?.permissions instanceof Map) {
    ret.yetkiler.permissions = Object.fromEntries(ret.yetkiler.permissions);
  }
  return ret;
};

module.exports = mongoose.model("RoleGroup", roleGroupSchema);
