// controllers/havalimani.controller.js
const XLSX = require("xlsx");
const path = require("path");
const Havalimani = require("../models/havalimanı/havalimani.model");

// ⚡ Cache invalidation için
const dataLoader = require("../utils/dataLoader");

// Küçük yardımcılar
const str = (v) => (v === null || v === undefined ? "" : String(v)).trim();

/**
 * 🟢 Excel'den toplu veri yükleme
 * Beklenen öncelikli kolonlar:
 *  - HAVALİMANI ADI  -> adi
 *  - İL KODU         -> il_kodu (opsiyonel)
 *  - İLÇE KODU       -> ilce_kodu (opsiyonel)
 * Yedek kolonlar:
 *  - BULUNDUĞU YER   -> ilce_kodu (eğer İLÇE KODU yoksa)
 */
exports.importHavalimanlari = async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../excels/Ulaşım Uygulama Bigileri Güncel.xlsx"
    );

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Havalimanı Listesi"];
    if (!sheet) {
      return res.status(400).json({
        message: "İçe aktarma hatası",
        data: { error: '"Havalimanı Listesi" sayfası bulunamadı' },
      });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const mapped = rows
      .map((row) => {
        const adi = str(row["HAVALİMANI ADI"]);
        if (!adi) return null; // adi zorunlu

        // Öncelik: açıkça verilen kod alanları
        let il_kodu = str(row["İL KODU"]);
        let ilce_kodu = str(row["İLÇE KODU"]);

        // Yedek: "BULUNDUĞU YER" varsa ve ilce_kodu boşsa
        if (!ilce_kodu) {
          const yer = str(row["BULUNDUĞU YER"]);
          if (yer) ilce_kodu = yer;
        }

        return {
          adi,
          il_kodu,   // model default "" olduğu için boş kalabilir
          ilce_kodu, // model default "" olduğu için boş kalabilir
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) {
      return res.status(400).json({
        message: "İçe aktarma hatası",
        data: { error: "Uygun veri bulunamadı (HAVALİMANI ADI eksik)." },
      });
    }

    const inserted = await Havalimani.insertMany(mapped);

    return res.json({
      message: "Havalimanları başarıyla yüklendi",
      data: { count: inserted.length },
    });
  } catch (err) {
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Tüm havalimanlarını getir
exports.getAllHavalimanlari = async (req, res) => {
  try {
    const havalimanlari = await Havalimani.find().sort({ adi: 1 });
    return res.json({
      message: "Havalimanları başarıyla getirildi",
      data: havalimanlari,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Listeleme hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Tek havalimanı getir
exports.getOneHavalimani = async (req, res) => {
  try {
    const havalimani = await Havalimani.findById(req.params.id);
    if (!havalimani) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null,
      });
    }
    return res.json({
      message: "Havalimanı başarıyla getirildi",
      data: havalimani,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Getirme hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Yeni havalimanı ekle
exports.createHavalimani = async (req, res) => {
  try {
    const { adi, il_kodu = "", ilce_kodu = "" } = req.body;

    const newRecord = await Havalimani.create({
      adi: str(adi),
      il_kodu: str(il_kodu),
      ilce_kodu: str(ilce_kodu),
    });

    // ⚡ Cache'e ekle (fire and forget)
    dataLoader.invalidateHavalimani(newRecord._id).catch(() => {});

    return res.status(201).json({
      message: "Havalimanı başarıyla oluşturuldu",
      data: newRecord,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Kayıt hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Havalimanı güncelle
exports.updateHavalimani = async (req, res) => {
  try {
    const payload = {};
    if (req.body.adi !== undefined) payload.adi = str(req.body.adi);
    if (req.body.il_kodu !== undefined) payload.il_kodu = str(req.body.il_kodu);
    if (req.body.kordinat !== undefined) payload.kordinat = str(req.body.kordinat);
    if (req.body.ilce_kodu !== undefined)
      payload.ilce_kodu = str(req.body.ilce_kodu);

    const updated = await Havalimani.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null,
      });
    }

    // ⚡ Cache'i temizle (fire and forget)
    dataLoader.invalidateHavalimani(req.params.id).catch(() => {});

    return res.json({
      message: "Havalimanı başarıyla güncellendi",
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Havalimanı sil
exports.deleteHavalimani = async (req, res) => {
  try {
    const deleted = await Havalimani.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        message: "Havalimanı bulunamadı",
        data: null,
      });
    }

    // ⚡ Cache'den sil (fire and forget)
    dataLoader.invalidateHavalimani(req.params.id).catch(() => {});

    return res.json({
      message: "Havalimanı başarıyla silindi",
      data: deleted,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Silme hatası",
      data: { error: err.message },
    });
  }
};

// 🟢 Tüm kayıtları sil
exports.deleteAllHavalimanlari = async (req, res) => {
  try {
    const result = await Havalimani.deleteMany({});
    return res.json({
      message: "Tüm havalimanları silindi",
      data: { deletedCount: result.deletedCount },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Toplu silme hatası",
      data: { error: err.message },
    });
  }
};
