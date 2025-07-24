const mongoose = require('mongoose');
const Page = require('../models/page.model');

mongoose.connect('mongodb://localhost:27017/acibadem');

const pages = [
  { _id: 1, name: "Araç Takip", code: "arac.takip" },
  { _id: 2, name: "Araç Listesi", code: "arac.liste" },
  { _id: 3, name: "Transfer Talepleri", code: "transfer.talep" },
  { _id: 4, name: "Personel Yönetimi", code: "admin.personel" },
  { _id: 5, name: "Raporlar", code: "admin.raporlar" },
  { _id: 6, name: "Seyahat Talepleri", code: "seyahat.talep" },
  { _id: 7, name: "Misafir Talepleri", code: "misafir.talep" }
];

async function seed() {
  try {
    await Page.deleteMany();
    await Page.insertMany(pages);
    console.log("✅ Sayfa verileri başarıyla yüklendi.");
    process.exit();
  } catch (err) {
    console.error("❌ Hata:", err);
    process.exit(1);
  }
}

seed();
