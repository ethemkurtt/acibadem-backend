#!/usr/bin/env node
/**
 * Excel'den plakaları MongoDB'ye import eder (lokal).
 * - Excel: ./excels/plakalar.xlsx
 * - Upsert: plaka'ya göre (aynı plaka varsa günceller)
 * - lokasyonId=null, lokasyonAd="", status=true
 * - id/plaka/bolum/marka/tip Excel'den alınır
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
  process.env.MONGODB_URI || "mongodb+srv://ethemkurt6154:GRt3N2X9trO6Vv82@acibadem.6fxtazv.mongodb.net/acibadem?retryWrites=true&w=majority&appName=acibadem";

const EXCEL_PATH = path.join(__dirname, "./excels/plakalar.xlsx");

function normalizePlaka(v) {
  return String(v).replace(/\s+/g, " ").trim().toUpperCase();
}

function pick(row, keys) {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(row, k)) {
      const val = String(row[k] ?? "").trim();
      if (val !== "") return val;
    }
  }
  return "";
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
  const sheet =
    wb.Sheets["PLAKALAR"] ||
    wb.Sheets["Plakalar"] ||
    wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    console.error('✖ Sayfa bulunamadı (örn. "PLAKALAR").');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log("→ Satır sayısı:", rows.length);

  const H = {
    id:    ["ID", "Id", "id"],
    plaka: ["PLAKA", "Plaka", "plaka"],
    bolum: ["BÖLÜMÜ", "BÖLÜM", "BOLUMU", "BOLUM", "BİRİM", "BIRIM"],
    marka: ["MARKA", "Marka", "marka"],
    tip:   ["TİPİ", "TIPI", "TİP", "TIP", "MODEL"]
  };

  const ops = [];
  let skipped = 0;

  for (const row of rows) {
    const plakaRaw = pick(row, H.plaka);
    if (!plakaRaw) { skipped++; continue; }

    const doc = {
      plaka: normalizePlaka(plakaRaw),
      bolum: pick(row, H.bolum) || undefined,
      marka: pick(row, H.marka) || undefined,
      tip:   pick(row, H.tip)   || undefined,
      lokasyonId: null,
      lokasyonAd: "",
      status: true
    };

    const idRaw = pick(row, H.id);
    if (idRaw) {
      const idNum = Number(idRaw);
      if (!Number.isNaN(idNum)) doc.id = idNum;
    }

    ops.push({
      updateOne: {
        filter: { plaka: doc.plaka },
        update: { $set: doc },
        upsert: true
      }
    });
  }

  if (ops.length === 0) {
    console.error("✖ Aktarılacak satır yok. (Boş dosya veya başlıklar eşleşmedi)");
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
