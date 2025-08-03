const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  access: { type: [Number], default: [] },
  tc: { type: String, default: null },

  departman: { type: mongoose.Schema.Types.ObjectId, ref: "Departman", default: null },
  lokasyon: { type: mongoose.Schema.Types.ObjectId, ref: "Lokasyon", default: null },
  bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", default: null },
  ulke: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", default: null },

  telefon: { type: String, default: null },
  mail: { type: String, default: null },
  dogumTarihi: { type: Date, default: null },
  cinsiyet: { type: String, enum: ["Erkek", "Kadın", "Diğer"], default: null },
  ehliyet: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
