// models/TicketRequest.js
const mongoose = require('mongoose');

const TicketRequestSchema = new mongoose.Schema(
  {
    // İstemciden gelen _token kaydetmiyoruz
    yolcu_sayisi: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    yon: {
      type: String,
      enum: ['tek', 'cift'], // tek: tek yön, cift: gidiş-dönüş
      required: true,
    },
    nereden: { type: String, trim: true, required: true }, // IATA kodu (örn: SAW)
    nereye: { type: String, trim: true, required: true },  // IATA kodu (örn: ADB)

    ucus_tarihi: { type: Date, required: true },
    ucus_saati: { type: String, trim: true, required: true }, // "HH:mm"

    havayolu: { type: String, trim: true, required: true },   // "THY"
    ucus_kodu: { type: String, trim: true, required: true },  // "123"

    bilet_sinifi: { type: String, trim: true, required: true }, // ECO, BUS, vb.
    ekstra_bagaj: { type: Number, default: 0 }, // kg

    bilet_opsiyon: { type: String, enum: ['evet', 'hayir'], default: 'hayir' },
    opsiyon_tarihi: { type: Date }, // opsiyon varsa tarih

    // Dönüş alanları (yon === 'cift' ise anlamlı)
    donus_tarihi: { type: Date },
    donus_saati: { type: String, trim: true },
    donus_havayolu: { type: String, trim: true, default: 'THY' },
    donus_ucus_kodu: { type: String, trim: true },

    aciklama: { type: String, trim: true },
  },
  { timestamps: true }
);

// Koşullu alan doğrulamaları
TicketRequestSchema.pre('validate', function (next) {
  // bilet opsiyon tarih kuralı
  if (this.bilet_opsiyon === 'evet' && !this.opsiyon_tarihi) {
    return next(new Error('bilet_opsiyon "evet" ise opsiyon_tarihi zorunludur.'));
  }

  // gidiş-dönüş ise dönüş alanları zorunlu
  if (this.yon === 'cift') {
    if (!this.donus_tarihi) {
      return next(new Error('yon "cift" ise donus_tarihi zorunludur.'));
    }
    if (!this.donus_saati) {
      return next(new Error('yon "cift" ise donus_saati zorunludur.'));
    }
  }

  next();
});

module.exports = mongoose.model('TicketRequest', TicketRequestSchema);
