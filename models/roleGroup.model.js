// models/roleGroup.model.js
const mongoose = require("mongoose");
const { decodeKeys } = require("../utils/dotKeyCodec");

const roleGroupSchema = new mongoose.Schema(
  {
    roleGroupId:   { type: String, required: true, unique: true, trim: true },
    roleGroupName: { type: String, required: true, trim: true },
    yetkiler: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

roleGroupSchema.index({ roleGroupId: 1 }, { unique: true });
roleGroupSchema.index({ roleGroupName: 1 });

if (!roleGroupSchema.options.toJSON) roleGroupSchema.options.toJSON = {};
roleGroupSchema.options.toJSON.transform = function (_doc, ret) {
  if (ret?.yetkiler instanceof Map) {
    // Map -> plain ve anahtarları decode et
    const plain = Object.fromEntries(ret.yetkiler);
    ret.yetkiler = decodeKeys(plain);
  }
  return ret;
};

module.exports = mongoose.model("RoleGroup", roleGroupSchema);
