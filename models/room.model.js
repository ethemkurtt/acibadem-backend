const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  kategori: { type: String, required: true },
  fiyat: { type: Number, required: true },
  kapasite: { type: Number, required: true },
  otelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Otel', required: true }
}, { timestamps: true });

module.exports = mongoose.model('room', roomSchema);
