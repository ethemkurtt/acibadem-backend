const mongoose = require('mongoose');

/**
 * talep_tipi: "OTB" (Otobüs), ilerde "TRN" (Tren) gibi varyantlar da olabilir.
 * sefer_tarihi: YYYY-MM-DD stringi olarak gelir; Date'e map'liyoruz (flatpickr).
 * sefer_saati: "HH:mm" string.
 * Readonly alanlar da DB'de tutulur (raporlama için faydalı).
 */
const DigerUlasimTalepSchema = new mongoose.Schema(
  {
    talep_tipi:     { type: String, trim: true, default: 'OTB' }, // Otobüs

    // Kişisel
    ad_soyad:       { type: String, trim: true },
    tc_pasaport:    { type: String, trim: true },
    email:          { type: String, trim: true },
    telefon:        { type: String, trim: true },

    // Temel
    tedarikci:      { type: String, trim: true, default: 'D TURİZM' },
    odeme_tipi:     { type: String, trim: true, default: 'Otomatik Gelecek' },
    fatura_bilgisi: { type: String, trim: true, default: 'Otomatik Gelecek' },
    sube:           { type: String, trim: true }, // (Şube)
    departman:      { type: String, trim: true },
    masraf_merkezi: { type: String, trim: true },

    // Sefer
    nereden:        { type: String, trim: true },
    nereye:         { type: String, trim: true },
    firma:          { type: String, trim: true },
    sefer_tarihi:   { type: Date },
    sefer_saati:    { type: String, trim: true }, // HH:mm

    // Ek
    aciklama:       { type: String, trim: true },

    // Kaynak tipi (opsiyonel) - personel/hasta/misafir gibi istersen burada da tutabilirsin:
    type:           { type: String, enum: ['personel','hasta','misafir'], default: 'personel', trim: true },
  },
  { timestamps: true }
);

// Basit normalizasyon: boş stringleri null'a çevir
DigerUlasimTalepSchema.pre('validate', function (next) {
  const nullable = ['sefer_saati', 'aciklama', 'firma'];
  for (const k of nullable) {
    if (this[k] === '') this[k] = undefined;
  }
  next();
});

module.exports = mongoose.model('DigerUlasimTalep', DigerUlasimTalepSchema);
