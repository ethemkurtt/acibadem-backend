// models/role.model.js
const mongoose = require("mongoose");
const roleSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  access: { type: [Number], default: [] },       // eski
  permissions: { type: [String], default: [] },  // 🔹 yeni
});
module.exports = mongoose.model("Role", roleSchema);
