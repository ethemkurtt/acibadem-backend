const mongoose = require('mongoose');

const UcakTalepSchema = new mongoose.Schema(
  {
    ad_soyad:       { type: String, trim: true },
    tc_pasaport:    { type: String, trim: true },
    dogum_tarihi:   { type: Date },
    cinsiyet:       { type: String, trim: true },
    telefon:        { type: String, trim: true },
    email:          { type: String, trim: true },

    tedarikci:      { type: String, trim: true },
    odeme_tipi:     { type: String, trim: true },
    fatura_bilgisi: { type: String, trim: true },
    lokasyon:       { type: String, trim: true },
    bolge:          { type: String, trim: true },
    ulke:           { type: String, trim: true },
    departman:      { type: String, trim: true },
    masraf_merkezi: { type: String, trim: true },

    yolcu_sayisi:   { type: Number, default: 1 },
    yon:            { type: String, enum: ['tek', 'gidisdonus'], default: 'tek' },
    nereden:        { type: String, trim: true },
    nereye:         { type: String, trim: true },

    ucus_tarihi:    { type: Date },
    ucus_saati:     { type: String, trim: true },

    havayolu:       { type: String, trim: true },
    ucus_kodu:      { type: String, trim: true },

    bilet_sinifi:   { type: String, trim: true },
    ekstra_bagaj:   { type: Number },

    bilet_opsiyon:  { type: String, enum: ['evet', 'hayir'], default: 'hayir' },
    opsiyon_tarihi: { type: Date },

    donus_tarihi:   { type: Date },
    donus_saati:    { type: String, trim: true },
    donus_havayolu: { type: String, trim: true },
    donus_ucus_kodu:{ type: String, trim: true },

    aciklama:       { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UcakTalep', UcakTalepSchema);
