#!/usr/bin/env node
/**
 * Başlıksız Excel'den (sütun indexlerine göre) plakaları MongoDB'ye import eder.
 * - Excel: ./excels/plakalar.xlsx
 * - Sütunlar: [0]=PLAKA, [1]=BÖLÜM, [2]=MARKA, [3]=TİP
 * - Upsert: plaka'ya göre (aynı plaka varsa günceller)
 * - lokasyonId=null, lokasyonAd="", status=true
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const mongoose = require("mongoose");

// MODELLER
const Plaka = require("./models/Plaka"); // models/Plaka.js

// Mongo bağlantısı
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ethemkurt6154:GRt3N2X9trO6Vv82@acibadem.6fxtazv.mongodb.net/acibadem?retryWrites=true&w=majority&appName=acibadem";

const EXCEL_PATH = path.join(__dirname, "./excels/test.xlsx");

// Plaka normalize: UPPERCASE + tek boşluk + trim
// (İstersen tamamen kıyas eşleşmesi için boşluk/tire vs. kaldırmak istersen:
// return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); )
function normalizePlaka(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("→ MongoDB bağlanıyor:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("✖ Excel dosyası bulunamadı:", EXCEL_PATH);
    process.exit(1);
  }

  console.log("→ Excel okunuyor:", EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);

  // İlk sayfayı kullan (ya da wb.Sheets[wb.SheetNames[index]])
  const sh = wb.Sheets[wb.SheetNames[0]];
  if (!sh) {
    console.error("✖ Sayfa bulunamadı (ilk sheet yok).");
    process.exit(1);
  }

  // Başlıksız okuma: header:1 -> Array-of-Arrays (row -> [col0, col1, ...])
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" });
  console.log("→ Satır sayısı:", rows.length);

  const ops = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const plakaRaw = row[0];          // 1. sütun: plaka
    const bolumRaw = row[1];          // 2. sütun: bölüm
    const markaRaw = row[2];          // 3. sütun: marka
    const tipRaw   = row[3];          // 4. sütun: tip

    const plakaStr = String(plakaRaw || "").trim();
    if (!plakaStr) { skipped++; continue; }

    const doc = {
      plaka: normalizePlaka(plakaStr),
      bolum: String(bolumRaw || "").trim() || undefined,
      marka: String(markaRaw || "").trim() || undefined,
      tip:   String(tipRaw   || "").trim() || undefined,
      lokasyonId: null,
      lokasyonAd: "",
      status: true
    };

    ops.push({
      updateOne: {
        filter: { plaka: doc.plaka },
        update: { $set: doc },
        upsert: true
      }
    });
  }

  if (ops.length === 0) {
    console.error("✖ Aktarılacak satır yok. (Excel boş olabilir)");
    process.exit(1);
  }

  console.log("→ Yazılıyor (bulk upsert)... kayıt:", ops.length);
  const result = await Plaka.bulkWrite(ops, { ordered: false });

  console.log("✓ Bitti!");
  console.table({
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
    matched:  result.matchedCount  || 0,
    skipped
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("✖ Hata:", err?.message || err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
