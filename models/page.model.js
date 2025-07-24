const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  _id: Number, // örneğin 1, 2, 3 gibi sayfa ID’leri
  name: String, // Görünen ad (örn: Araç Takip)
  code: String, // İç sistemde route için (örn: arac.takip)
});

module.exports = mongoose.model('Page', pageSchema);
