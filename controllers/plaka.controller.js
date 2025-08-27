// controllers/plaka.controller.js
const XLSX = require("xlsx");
const path = require("path");
const Plaka = require("../models/Plaka");

// ---------- IMPORT (Excel: excels/plakalar.xlsx) ----------
exports.importPlakalar = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/plakalar.xlsx");
    const wb = XLSX.readFile(filePath);
    const sheet =
      wb.Sheets["PLAKALAR"] ||
      wb.Sheets["Plakalar"] ||
      wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      return res.status(400).json({ message: "Excel sayfası bulunamadı." });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const pick = (row, keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
      }
      return "";
    };

    const HEADERS = {
      id:    ["ID", "Id", "id"],
      plaka: ["PLAKA", "Plaka", "plaka"],
      bolum: ["BÖLÜMÜ", "BÖLÜM", "BOLUMU", "BOLUM", "BİRİM", "BIRIM"],
      marka: ["MARKA", "Marka", "marka"],
      tip:   ["TİPİ", "TIPI", "TİP", "TIP", "MODEL"]
    };

    const ops = [];
    let skipped = 0;

    for (const row of rows) {
      const plakaRaw = pick(row, HEADERS.plaka);
      if (!plakaRaw) { skipped++; continue; }

      const doc = {
        // normalize plaka
        plaka: plakaRaw.replace(/\s+/g, " ").trim().toUpperCase(),
        bolum: pick(row, HEADERS.bolum) || undefined,
        marka: pick(row, HEADERS.marka) || undefined,
        tip:   pick(row, HEADERS.tip)   || undefined,
        // İstek gereği boş bırakılır
        lokasyonId: null,
        lokasyonAd: "",
        status: true
      };

      const idRaw = pick(row, HEADERS.id);
      if (idRaw) {
        const idNum = Number(idRaw);
        doc.id = Number.isNaN(idNum) ? undefined : idNum;
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
      return res.status(400).json({ message: "Aktarılacak satır bulunamadı.", skipped });
    }

    const result = await Plaka.bulkWrite(ops, { ordered: false });

    res.json({
      message: "Plakalar içe aktarıldı",
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      matched:  result.matchedCount  || 0,
      skipped
    });
  } catch (err) {
    res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
  }
};

// ---------- CRUD ----------
exports.create = async (req, res) => {
  try {
    const created = await Plaka.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    const status = err.code === 11000 ? 409 : 400;
    res.status(status).json({ message: "Oluşturma hatası", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { q, status, lokasyonId, id, limit = 200, skip = 0 } = req.query;

    const filter = {};
    if (typeof id !== "undefined" && id !== "") {
      const idNum = Number(id);
      if (!Number.isNaN(idNum)) filter.id = idNum;
    }
    if (typeof status !== "undefined" && status !== "") {
      // "true/false/1/0" -> Boolean
      const val = String(status).toLowerCase();
      filter.status = (val === "true" || val === "1");
    }
    if (lokasyonId) filter.lokasyonId = lokasyonId;
    if (q) {
      const r = { $regex: String(q), $options: "i" };
      filter.$or = [
        { plaka: r }, { bolum: r }, { marka: r }, { tip: r }, { lokasyonAd: r }
      ];
    }

    const data = await Plaka.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Listeleme hatası", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Plaka.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Plaka bulunamadı" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Getirme hatası", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Plaka.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Plaka bulunamadı" });
    res.json(updated);
  } catch (err) {
    const status = err.code === 11000 ? 409 : 400;
    res.status(status).json({ message: "Güncelleme hatası", error: err.message });
  }
};

exports.patch = async (req, res) => {
  try {
    const updated = await Plaka.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Plaka bulunamadı" });
    res.json(updated);
  } catch (err) {
    const status = err.code === 11000 ? 409 : 400;
    res.status(status).json({ message: "Kısmi güncelleme hatası", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Plaka.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Plaka bulunamadı" });
    res.json({ message: "Silindi", deleted });
  } catch (err) {
    res.status(500).json({ message: "Silme hatası", error: err.message });
  }
};
