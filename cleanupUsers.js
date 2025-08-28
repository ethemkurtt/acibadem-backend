#!/usr/bin/env node
/**
 * Excel'deki MAIL listesine göre kullanıcıları siler.
 * - Excel: ./excel/personeller.xlsx
 * - Sadece listedeki mailleri siler, diğer kullanıcılar kalır
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const mongoose = require("mongoose");

// MODELLER
const User = require("./models/user.model");

// Mongo bağlantısı
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ethemkurt6154:GRt3N2X9trO6Vv82@acibadem.6fxtazv.mongodb.net/acibadem?retryWrites=true&w=majority&appName=acibadem";

const EXCEL_PATH = path.join(__dirname, "./excels/personeller.xlsx");

// Header normalize (MAİL → MAIL)
function normalizeHeader(h) {
  if (!h) return "";
  const map = { ı:"i", İ:"i", ğ:"g", Ğ:"g", ü:"u", Ü:"u", ş:"s", Ş:"s", ö:"o", Ö:"o", ç:"c", Ç:"c" };
  return String(h)
    .trim()
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, m => map[m] || m)
    .toUpperCase();
}

async function main() {
  console.log("→ MongoDB bağlanıyor:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("✖ Excel bulunamadı:", EXCEL_PATH);
    process.exit(1);
  }

  console.log("→ Excel okunuyor:", EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  const sh = wb.Sheets[wb.SheetNames[0]];
  const rowsRaw = XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" });

  if (!rowsRaw.length) {
    console.error("✖ Excel boş");
    process.exit(1);
  }

  // Başlıkları normalize et
  const headers = rowsRaw[0].map(normalizeHeader);
  const dataRows = rowsRaw.slice(1);

  const rows = dataRows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });

  // Excel’deki tüm mail adreslerini topla
  const emails = rows
    .map(r => String(r["MAIL"] || "").trim().toLowerCase())
    .filter(e => e);

  if (!emails.length) {
    console.warn("✖ Excel’de hiç email bulunamadı!");
    process.exit(0);
  }

  console.log("→ Silinecek kullanıcı sayısı:", emails.length);

  // Mongo’dan sil
  const result = await User.deleteMany({ email: { $in: emails } });

  console.log("✓ Silinen kayıt sayısı:", result.deletedCount);

  await mongoose.disconnect();
  console.log("✓ Tamamlandı.");
}

main().catch(async (err) => {
  console.error("✖ Genel hata:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
