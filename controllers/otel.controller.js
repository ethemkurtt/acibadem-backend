const Otel = require("../models/otel/otel.model");
const XLSX = require("xlsx");
const path = require("path");

exports.importOtellerFromExcel = async (req, res) => {
  try {
    // Excel dosyasını doğrudan path'ten oku
    const filePath = path.join(
      __dirname,
      "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx"
    );
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"]; // sekme adı

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const mapped = rows.map((row) => ({
      otelAdi: row["OTEL ADI"] || "",
      lokasyon: row["LOKASYON"] || "",
      rezervasyonEmail:
        row["REZERVASYON MAİL ADRESİ"] || "",
      yetkiliKisi: row["YETKİLİ KİŞİ"] || "",
      yetkiliIletisim: row["YETKİLİ KİŞİ İLETİŞİM"] || "",
      adres: row["OTEL AÇIK ADRES"] || "",
      firmaUnvani: row["FİRMA UNVANI "] || "",
      vergiDairesi: row["VERGİ DAİRESİ"] || "",
      vergiNo: row["VERGİ NUMARASI"] || "",
    }));

    const inserted = await Otel.insertMany(mapped);
    res.json({
      message: "Otel verileri başarıyla yüklendi",
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error: error.message });
  }
};

exports.createOtel = async (req, res) => {
  try {
    const otel = await Otel.create(req.body);
    res.status(201).json(otel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOteller = async (req, res) => {
  const oteller = await Otel.find().sort({ createdAt: -1 });
  res.json(oteller);
};

exports.getOtelById = async (req, res) => {
  const otel = await Otel.findById(req.params.id);
  if (!otel) return res.status(404).json({ message: "Otel bulunamadı" });
  res.json(otel);
};

exports.updateOtel = async (req, res) => {
  const updated = await Otel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updated)
    return res.status(404).json({ message: "Güncelleme başarısız" });
  res.json(updated);
};

exports.deleteOtel = async (req, res) => {
  const deleted = await Otel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Silme başarısız" });
  res.json({ message: "Otel silindi" });
};
