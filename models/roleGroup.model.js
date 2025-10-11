// models/roleGroup.model.js
const mongoose = require("mongoose");

const roleGroupSchema = new mongoose.Schema(
  {
    roleGroupId:   { type: String, required: true, unique: true, trim: true },
    roleGroupName: { type: String, required: true, trim: true },

    // Gönderdiğin her şeyi olduğu gibi saklar (key ve value sınırlaması yok)
    yetkiler: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // 0/1, true/false, string vs. hepsi olur
      default: {},
    },
  },
  { timestamps: true }
);

// indeksler
roleGroupSchema.index({ roleGroupId: 1 }, { unique: true });
roleGroupSchema.index({ roleGroupName: 1 });

// JSON çıktısında Map -> plain object
if (!roleGroupSchema.options.toJSON) roleGroupSchema.options.toJSON = {};
roleGroupSchema.options.toJSON.transform = function (_doc, ret) {
  if (ret?.yetkiler instanceof Map) {
    ret.yetkiler = Object.fromEntries(ret.yetkiler);
  }
  return ret;
};

module.exports = mongoose.model("RoleGroup", roleGroupSchema);
