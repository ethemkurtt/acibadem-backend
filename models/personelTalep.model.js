const mongoose = require("mongoose");

const PersonelTalepSchema = new mongoose.Schema(
  {
    requestType: { type: String, default: "personel" },
    fullName: { type: String, required: true },
    passportNo: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    lokasyon: { type: String, required: true },
    departman: { type: String, required: true },
    soforDurumu: {
      type: String,
      enum: ["Şoförlü", "Şoförsüz"],
      required: true,
    },
    aciklama: { type: String },
    companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions" }],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes" }],
    // Yeni alanlar
    arac: { type: mongoose.Schema.Types.ObjectId, ref: "Plaka", default: null },
    sofor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    atamaDurumu: { type: String, enum: ["Evet", "Hayır"], default: "Hayır" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PersonelTalep", PersonelTalepSchema);
