const mongoose = require('mongoose');

const DigerTalepSchema = new mongoose.Schema({
  talep_tipi:        { type: String, trim: true, default: null },
  talep_tipi_diger:  { type: String, trim: true, default: null },
  alt_tip:           { type: String, trim: true, default: null },
  alt_tip_diger:     { type: String, trim: true, default: null },
  talep_aciklama:    { type: String, trim: true, default: null },
  nereden:           { type: String, trim: true, default: null },
  nereye:            { type: String, trim: true, default: null },
  transfer_tarih:    { type: String, trim: true, default: null },
  transfer_saat:     { type: String, trim: true, default: null },
}, { timestamps: true });

module.exports = mongoose.model('DigerTalep', DigerTalepSchema);
