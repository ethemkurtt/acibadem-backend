const mongoose = require('mongoose');

const VizeTalepSchema = new mongoose.Schema({
  talep_tipi:     { type: String, trim: true, default: 'VIZE' },

  // Kişisel
  ad_soyad:       { type: String, trim: true },
  tc_pasaport:    { type: String, trim: true },
  email:          { type: String, trim: true },
  telefon:        { type: String, trim: true },

  // Temel
  tedarikci:      { type: String, trim: true, default: 'D TURİZM' },
  odeme_tipi:     { type: String, trim: true, default: 'Otomatik Gelecek' },
  fatura_bilgisi: { type: String, trim: true, default: 'Otomatik Gelecek' },
  sube:           { type: String, trim: true },
  departman:      { type: String, trim: true },
  masraf_merkezi: { type: String, trim: true },

  // Vize
  vize_ulke:      { type: String, trim: true },

  // Sadece dosya adları
  evrak_adlari:   { type: [String], default: [] },

  // İsteğe bağlı: type (personel/hasta/misafir)
  type:           { type: String, enum: ['personel','hasta','misafir'], default: 'personel', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('VizeTalep', VizeTalepSchema);
