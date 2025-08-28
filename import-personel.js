#!/usr/bin/env node
/**
 * Excel'den kullanıcıları MongoDB'ye import eder.
 * - Excel: ./excel/personeller.xlsx
 * - Kolonlar: AD SOYAD, BAGLI_ORGANIZASYON, LOKASYON, GOREV_ADI,
 *             PERSONEL_GRUBU, MAİL, YETKİ, CİNSİYET, TC, TEL NO
 * - Upsert: email’e göre (aynı email varsa günceller)
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MODELLER
const User = require("./models/user.model");
const Lokasyon = require("./models/lokasyon.model");
const Departman = require("./models/departman.model");

// Mongo bağlantısı
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ethemkurt6154:GRt3N2X9trO6Vv82@acibadem.6fxtazv.mongodb.net/acibadem?retryWrites=true&w=majority&appName=acibadem";

const EXCEL_PATH = path.join(__dirname, "./excels/personeller.xlsx");

// Password stratejisi
const USE_TEMP_PASSWORD = true;
function genPassword() {
  return Math.random().toString(36).slice(-8);
}

// Telefon normalize
function cleanPhone(v) {
  if (!v) return null;
  let t = String(v).replace(/\D+/g, "");
  if (t.startsWith("90")) return "+" + t;
  if (t.startsWith("0")) return "+90" + t.slice(1);
  return "+90" + t;
}

// Cinsiyet normalize
function cleanGender(v) {
  if (!v) return null;
  const s = String(v).toLowerCase();
  if (s.includes("erkek")) return "Erkek";
  if (s.includes("kad")) return "Kadın";
  return "Diğer";
}

// Türkçe karakter normalize
function normalizeTr(str) {
  if (!str) return "";
  const map = { ı:"i", İ:"i", ğ:"g", Ğ:"g", ü:"u", Ü:"u", ş:"s", Ş:"s", ö:"o", Ö:"o", ç:"c", Ç:"c" };
  return String(str)
    .trim()
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, m => map[m] || m)
    .toLowerCase();
}

// RoleGroup ID için normalize
function toRoleId(v) {
  return normalizeTr(v).replace(/\s+/g, "");
}

// Header normalize
function normalizeHeader(h) {
  return normalizeTr(h).toUpperCase();
}

// Lokasyon eşleştirme
async function findLokasyon(name) {
  if (!name) return { _id: null, ad: null };
  const normName = normalizeTr(name);
  const docs = await Lokasyon.find();
  const match = docs.find(d => normalizeTr(d.ad) === normName);
  return match ? { _id: match._id, ad: match.ad } : { _id: null, ad: null };
}

// Departman eşleştirme
async function findDepartman(name) {
  if (!name) return { _id: null, ad: null };
  const normName = normalizeTr(name);
  const docs = await Departman.find();
  const match = docs.find(d => normalizeTr(d.ad) === normName);
  return match ? { _id: match._id, ad: match.ad } : { _id: null, ad: null };
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

  // Başlık normalize
  const headers = rowsRaw[0].map(normalizeHeader);
  const dataRows = rowsRaw.slice(1);

  const rows = dataRows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });

  console.log("→ Satır sayısı:", rows.length);

  let created = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    try {
      const name = String(row["AD SOYAD"] || "").trim();
      const organizasyon = String(row["BAGLI_ORGANIZASYON"] || "").trim();
      const personelGrubu = String(row["PERSONEL_GRUBU"] || "").trim();
      const email = String(row["MAIL"] || "").trim().toLowerCase();
      const roleGroupId = toRoleId(row["YETKI"]);
      const cinsiyet = cleanGender(row["CINSIYET"]);
      const tc = String(row["TC"] || "").trim() || null;
      const telefon = cleanPhone(row["TEL NO"]);

      // Normalize eşleşmeler
      const { _id: lokasyonId, ad: lokasyonName } = await findLokasyon(row["LOKASYON"]);
      const { _id: departmanId, ad: departmanName } = await findDepartman(row["BAGLI_ORGANIZASYON"]);

      if (!name || !email || !organizasyon || !personelGrubu || !roleGroupId) {
        skipped++;
        console.warn("! Eksik alan, atlandı:", { name, email, organizasyon, personelGrubu, roleGroupId });
        continue;
      }

      let password;
      if (USE_TEMP_PASSWORD) {
        password = await bcrypt.hash(genPassword(), 10);
      } else {
        password = "";
      }

      const data = {
        name,
        email,
        organizasyon,
        personelGrubu,
        roleGroupId,
        cinsiyet,
        tc,
        telefon,
        departman: departmanId || null,
        departmanName: departmanName || null,
        lokasyon: lokasyonId || null,
        lokasyonName: lokasyonName || null,
        perms: [],
        permissions: {}
      };

      const existing = await User.findOne({ email });
      if (existing) {
        await User.updateOne({ _id: existing._id }, { $set: data });
        updated++;
        console.log("~ güncellendi:", email);
      } else {
        await new User({ ...data, password }).save();
        created++;
        console.log("+ eklendi:", email);
      }
    } catch (e) {
      console.error("✖ Hata satırda:", e.message);
      skipped++;
    }
  }

  console.log("\n==== ÖZET ====");
  console.log("Oluşturulan:", created);
  console.log("Güncellenen:", updated);
  console.log("Atlanan/Hatalı:", skipped);

  await mongoose.disconnect();
  console.log("✓ Tamamlandı.");
}

main().catch(async (err) => {
  console.error("✖ Genel hata:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
