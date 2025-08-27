const XLSX = require("xlsx");
const path = require("path");
const Lokasyon = require("../models/lokasyon.model");

exports.importLokasyonlar = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Şehir için olası kolon adları (varsa alır, yoksa yok sayar)
    const pick = (row, keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && String(row[k]).trim() !== "") return String(row[k]).trim();
      }
      return "";
    };
    const CITY_NAME_KEYS = ["İL", "IL", "ŞEHİR", "SEHIR", "İL ADI", "IL ADI", "CITY"];
    const CITY_ID_KEYS   = ["İL KODU", "PLAKA", "PLAKA KODU", "IL KODU", "SEHIR KODU"];

    // Tüm lokasyonları çek ve tekrarsız hale getir (mevcut davranış korunur)
    const lokasyonSet = new Set();
    rows.forEach(row => {
      if (row["LOKASYON"]) {
        lokasyonSet.add(row["LOKASYON"].trim());
      }
    });

    // Opsiyonel şehir bilgisini de ekle (Excel'de varsa)
    const lokasyonArray = [];
    rows.forEach(row => {
      const ad = row["LOKASYON"] ? String(row["LOKASYON"]).trim() : "";
      if (!ad || !lokasyonSet.has(ad)) return; // ad set’ine göre tekilleştirme

      // set'ten bir kez tüketelim ki tekrarı eklemeyelim
      lokasyonSet.delete(ad);

      const sehirName = pick(row, CITY_NAME_KEYS);
      const sehirIdRaw = pick(row, CITY_ID_KEYS);
      const sehirIdNum = sehirIdRaw ? parseInt(sehirIdRaw, 10) : undefined;
      const sehirId = Number.isNaN(sehirIdNum) ? undefined : sehirIdNum;

      const doc = { ad };
      if (sehirName) doc.sehirName = sehirName; // modelde opsiyonelse sorun olmaz
      if (sehirId)   doc.sehirId = sehirId;

      lokasyonArray.push(doc);
    });

    const result = await Lokasyon.insertMany(lokasyonArray, { ordered: false });

    res.json({ message: "Lokasyonlar başarıyla yüklendi", count: result.length });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: "Bazı lokasyonlar zaten kayıtlı", error: err.message });
    } else {
      res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
    }
  }
};

exports.getAllLokasyonlar = async (req, res) => {
  const data = await Lokasyon.find().sort({ ad: 1 });
  res.json(data);
};

exports.deleteAllLokasyonlar = async (req, res) => {
  const result = await Lokasyon.deleteMany({});
  res.json({ message: "Tüm lokasyonlar silindi", deletedCount: result.deletedCount });
};
