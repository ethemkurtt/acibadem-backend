const Otel = require("../models/otel/otel.model");
const XLSX = require("xlsx");
const path = require("path");

// 🟢 Excel'den toplu otel içe aktarma
exports.importOtellerFromExcel = async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx"
    );
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"];

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const mapped = rows.map((row) => ({
      otelAdi: (row["OTEL ADI"] || "").toString().trim(),
      lokasyon: (row["LOKASYON"] || "").toString().trim(),
      rezervasyonEmail: (row["REZERVASYON MAİL ADRESİ"] || "").toString().trim(),
      yetkiliKisi: (row["YETKİLİ KİŞİ"] || "").toString().trim(),
      yetkiliIletisim: (row["YETKİLİ KİŞİ İLETİŞİM"] || "").toString().trim(),
      adres: (row["OTEL AÇIK ADRES"] || "").toString().trim(),
      firmaUnvani: (row["FİRMA UNVANI "] || "").toString().trim(),
      vergiDairesi: (row["VERGİ DAİRESİ"] || "").toString().trim(),
      vergiNo: (row["VERGİ NUMARASI"] || "").toString().trim(),
    }));

    const inserted = await Otel.insertMany(mapped, { ordered: false });

    return res.json({
      message: "Otel verileri başarıyla yüklendi",
      data: { count: inserted.length }
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 500;
    const msg = error?.code === 11000 ? "Bazı oteller zaten kayıtlı" : "İçe aktarma hatası";
    return res.status(status).json({
      message: msg,
      data: { error: error.message }
    });
  }
};

// 🟢 Otel oluştur
exports.createOtel = async (req, res) => {
  try {
    const otel = await Otel.create(req.body);
    return res.status(201).json({
      message: "Otel başarıyla oluşturuldu",
      data: otel
    });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    return res.status(status).json({
      message: "Otel oluşturma hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Tüm otelleri getir
exports.getOteller = async (req, res) => {
  try {
    const oteller = await Otel.find().sort({ createdAt: -1 });
    return res.json({
      message: "Oteller başarıyla getirildi",
      data: oteller
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 ID ile otel getir
exports.getOtelById = async (req, res) => {
  try {
    const otel = await Otel.findById(req.params.id);
    if (!otel) {
      return res.status(404).json({
        message: "Otel bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Otel başarıyla getirildi",
      data: otel
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Otel güncelle
exports.updateOtel = async (req, res) => {
  try {
    const updated = await Otel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({
        message: "Otel bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Otel başarıyla güncellendi",
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

// 🟢 Otel sil
exports.deleteOtel = async (req, res) => {
  try {
    const deleted = await Otel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Otel bulunamadı",
        data: null
      });
    }
    return res.json({
      message: "Otel başarıyla silindi",
      data: deleted
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};
