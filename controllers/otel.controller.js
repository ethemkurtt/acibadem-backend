// controllers/otel.controller.js
const Otel = require("../models/otel/otel.model");
const XLSX = require("xlsx");
const path = require("path");

// ---- küçük yardımcılar ----
const toIntOrUndefined = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const emptyToUndefined = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};

// Yalnızca izin verilen alanları al + tipleri düzenle
const buildOtelPayload = (src = {}) => ({
  otelAdi:          emptyToUndefined(src.otelAdi),
  lokasyon:         emptyToUndefined(src.lokasyon),
  rezervasyonEmail: emptyToUndefined(src.rezervasyonEmail),
  yetkiliKisi:      emptyToUndefined(src.yetkiliKisi),
  yetkiliIletisim:  emptyToUndefined(src.yetkiliIletisim),
  adres:            emptyToUndefined(src.adres),
  firmaUnvani:      emptyToUndefined(src.firmaUnvani),
  vergiDairesi:     emptyToUndefined(src.vergiDairesi),
  vergiNo:          emptyToUndefined(src.vergiNo),

  // yeni alanlar (opsiyonel)
  il_kodu:   toIntOrUndefined(src.il_kodu),
  ilce_kodu: toIntOrUndefined(src.ilce_kodu),
  kordinat:  emptyToUndefined(src.kordinat),
});

// 🟢 Excel'den toplu otel içe aktarma
exports.importOtellerFromExcel = async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx"
    );
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["OTEL ADRESLERİ"];
    if (!sheet) {
      return res.status(400).json({
        message: "Excel sayfası bulunamadı (OTEL ADRESLERİ)",
        data: null,
      });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Burada kolon adlarını Excel'ine göre ayarla.
    // İL/İLÇE için kolonu yoksa boş bırakılır.
    const mapped = rows.map((row) =>
      buildOtelPayload({
        otelAdi:          row["OTEL ADI"],
        lokasyon:         row["LOKASYON"],
        rezervasyonEmail: row["REZERVASYON MAİL ADRESİ"],
        yetkiliKisi:      row["YETKİLİ KİŞİ"],
        yetkiliIletisim:  row["YETKİLİ KİŞİ İLETİŞİM"],
        adres:            row["OTEL AÇIK ADRES"],
        firmaUnvani:      row["FİRMA UNVANI "], // Excel'de sondaki boşluk varsa
        vergiDairesi:     row["VERGİ DAİRESİ"],
        vergiNo:          row["VERGİ NUMARASI"],

        // yeni alanlar — Excel'de kolon isimleri farklıysa güncelle:
        il_kodu:          row["İL KODU"] ?? row["IL KODU"] ?? row["IL_KODU"],
        ilce_kodu:        row["İLÇE KODU"] ?? row["ILCE KODU"] ?? row["ILCE_KODU"],
        kordinat:         row["KORDİNAT"] ?? row["KONUM"] ?? row["KOORDİNAT"],
      })
    );

    const inserted = await Otel.insertMany(mapped, { ordered: false });

    return res.json({
      message: "Otel verileri başarıyla yüklendi",
      data: { count: inserted.length },
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 500;
    const msg =
      error?.code === 11000
        ? "Bazı oteller zaten kayıtlı"
        : "İçe aktarma hatası";
    return res.status(status).json({
      message: msg,
      data: { error: error.message },
    });
  }
};

// 🟢 Otel oluştur
exports.createOtel = async (req, res) => {
  try {
    const payload = buildOtelPayload(req.body);
    const otel = await Otel.create(payload);
    return res.status(201).json({
      message: "Otel başarıyla oluşturuldu",
      data: otel,
    });
  } catch (err) {
    const status = err?.code === 11000 ? 409 : 400;
    return res.status(status).json({
      message: "Otel oluşturma hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Tüm otelleri getir (opsiyonel filtre: il_kodu, ilce_kodu)
exports.getOteller = async (req, res) => {
  try {
    const q = {};
    if (req.query.il_kodu)   q.il_kodu   = toIntOrUndefined(req.query.il_kodu);
    if (req.query.ilce_kodu) q.ilce_kodu = toIntOrUndefined(req.query.ilce_kodu);

    const oteller = await Otel.find(q).sort({ createdAt: -1 });
    return res.json({
      message: "Oteller başarıyla getirildi",
      data: oteller,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message },
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
        data: null,
      });
    }
    return res.json({
      message: "Otel başarıyla getirildi",
      data: otel,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Otel güncelle
exports.updateOtel = async (req, res) => {
  try {
    const payload = buildOtelPayload(req.body);
    const updated = await Otel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        message: "Otel bulunamadı",
        data: null,
      });
    }

    return res.json({
      message: "Otel başarıyla güncellendi",
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message },
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
        data: null,
      });
    }
    return res.json({
      message: "Otel başarıyla silindi",
      data: deleted,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message },
    });
  }
};
