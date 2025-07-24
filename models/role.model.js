const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  access: { type: [Number], default: [] }
}, {
  timestamps: true // oluşturulma ve güncellenme zamanı için opsiyonel
});

module.exports = mongoose.model("Role", roleSchema);
