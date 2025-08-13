const mongoose = require('mongoose');

const TemsilTalepSchema = new mongoose.Schema({
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
  bolge:          { type: String, trim: true },

  // Organizasyon
  talep_tipi:     { type: String, trim: true, default: 'Temsil Ağırlama' },
  restorant:      { type: String, trim: true },
  katilimci_sayisi:{ type: Number, min: 1, default: 1 },
  alkol_bilgisi:  { type: String, enum: ['Alkollü','Alkolsüz'], default: 'Alkolsüz' },

  // Ek
  aciklama:       { type: String, trim: true },

  // Kaynağı istersen takip et (opsiyonel)
  type:           { type: String, enum: ['personel','hasta','misafir'], default: 'personel', trim: true },
}, { timestamps: true });

// Basit normalizasyon
TemsilTalepSchema.pre('validate', function(next){
  if (this.katilimci_sayisi != null) {
    const n = Number(this.katilimci_sayisi);
    if (!Number.isNaN(n)) this.katilimci_sayisi = n;
  }
  next();
});

module.exports = mongoose.model('TemsilTalep', TemsilTalepSchema);
