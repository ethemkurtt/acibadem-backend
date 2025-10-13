// models/talepler/misafirTalepDetay.model.js
const mongoose = require("mongoose");


const MisafirTalepDetaySchema = new mongoose.Schema(
  {

    talep_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Talepler",
      default: null,
      index: true,
    },
    bolge: { type: mongoose.Schema.Types.ObjectId, ref: "Bolge", default: null },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Ulke", default: null },
    language: { type: String, default: "" },
    wheelchair: { type: String, enum: ["Evet", "Hayır"], default: null },
    aciklama: { type: String, default: "" },
    companions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Companions", default: undefined }],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Routes", default: undefined }],
    notificationPerson: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationPerson", default: null },
  },
  {
    timestamps: true,
    minimize: false, // boş objeler de yazılsın
    strict: true,
  }
);

MisafirTalepDetaySchema.index(
  { talep_id: 1 },
  { unique: true, partialFilterExpression: { talep_id: { $type: "objectId" } } }
);

// İsteğe bağlı yardımcı indeksler
MisafirTalepDetaySchema.index({ language: 1 });
MisafirTalepDetaySchema.index({ wheelchair: 1 });

module.exports = mongoose.model("MisafirTalepDetay", MisafirTalepDetaySchema);
