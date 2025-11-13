const fs = require("fs");
const path = require("path");
const Bolge = require("../models/bolge.model");
const Ulke = require("../models/ulke.model");

// ⚡ Cache invalidation için
const dataLoader = require("../utils/dataLoader");

/** ✅ JSON'dan Bölge + Ülke ekleme */
exports.importFromJson = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data/regions.json");
    const rawData = fs.readFileSync(filePath, "utf8");
    const regions = JSON.parse(rawData);

    let addedRegions = 0;
    let addedCountries = 0;

    for (const region of regions) {
      let bolge = await Bolge.findOne({ ad: region.bolge });
      if (!bolge) {
        bolge = await Bolge.create({ ad: region.bolge });
        addedRegions++;
      }

      for (const country of region.ulkeler) {
        const exists = await Ulke.findOne({ ad: country, bolgeId: bolge._id });
        if (!exists) {
          await Ulke.create({ ad: country, bolgeId: bolge._id });
          addedCountries++;
        }
      }
    }

    return res.json({
      message: "JSON'dan veri başarıyla aktarıldı",
      data: { addedRegions, addedCountries }
    });
  } catch (err) {
    return res.status(500).json({
      message: "İçe aktarma hatası",
      data: { error: err.message }
    });
  }
};

///////////////////// 📌 BÖLGELER CRUD /////////////////////

exports.getBolgeler = async (req, res) => {
  try {
    const bolgeler = await Bolge.find().sort({ ad: 1 });
    return res.json({
      message: "Bölgeler başarıyla getirildi",
      data: bolgeler
    });
  } catch (err) {
    return res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.createBolge = async (req, res) => {
  try {
    const bolge = await Bolge.create({ ad: req.body.ad });
    
    // ⚡ Cache'e ekle (fire and forget)
    dataLoader.invalidateBolge(bolge._id).catch(() => {});
    
    return res.status(201).json({
      message: "Bölge başarıyla oluşturuldu",
      data: bolge
    });
  } catch (err) {
    return res.status(400).json({
      message: "Oluşturma hatası",
      data: { error: err.message }
    });
  }
};

exports.updateBolge = async (req, res) => {
  try {
    const bolge = await Bolge.findByIdAndUpdate(
      req.params.id,
      { ad: req.body.ad },
      { new: true, runValidators: true }
    );

    if (!bolge) {
      return res.status(404).json({
        message: "Bölge bulunamadı",
        data: null
      });
    }

    // ⚡ Cache'i temizle (fire and forget)
    dataLoader.invalidateBolge(req.params.id).catch(() => {});

    return res.json({
      message: "Bölge başarıyla güncellendi",
      data: bolge
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

exports.deleteBolge = async (req, res) => {
  try {
    const bolge = await Bolge.findByIdAndDelete(req.params.id);
    if (!bolge) {
      return res.status(404).json({
        message: "Bölge bulunamadı",
        data: null
      });
    }

    const countriesResult = await Ulke.deleteMany({ bolgeId: bolge._id });

    // ⚡ Cache'den sil (fire and forget)
    dataLoader.invalidateBolge(req.params.id).catch(() => {});

    return res.json({
      message: "Bölge ve bağlı ülkeler başarıyla silindi",
      data: {
        deletedBolgeId: bolge._id,
        deletedCountries: countriesResult.deletedCount || 0
      }
    });
  } catch (err) {
    return res.status(400).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};

///////////////////// 📌 ÜLKELER CRUD /////////////////////

exports.getUlkeler = async (req, res) => {
  try {
    const filter = req.query.bolgeId ? { bolgeId: req.query.bolgeId } : {};
    const ulkeler = await Ulke.find(filter)
      .populate("bolgeId", "ad")
      .sort({ ad: 1 });

    return res.json({
      message: "Ülkeler başarıyla getirildi",
      data: ulkeler
    });
  } catch (err) {
    return res.status(500).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.getUlkeById = async (req, res) => {
  try {
    const ulke = await Ulke.findById(req.params.id).populate("bolgeId", "ad");
    if (!ulke) {
      return res.status(404).json({
        message: "Ülke bulunamadı",
        data: null
      });
    }

    return res.json({
      message: "Ülke başarıyla getirildi",
      data: ulke
    });
  } catch (err) {
    return res.status(400).json({
      message: "Veri getirme hatası",
      data: { error: err.message }
    });
  }
};

exports.createUlke = async (req, res) => {
  try {
    const { ad, bolgeId } = req.body;
    const ulke = await Ulke.create({ ad, bolgeId });

    // ⚡ Cache'e ekle (fire and forget)
    dataLoader.invalidateUlke(ulke._id).catch(() => {});

    return res.status(201).json({
      message: "Ülke başarıyla oluşturuldu",
      data: ulke
    });
  } catch (err) {
    return res.status(400).json({
      message: "Oluşturma hatası",
      data: { error: err.message }
    });
  }
};

exports.updateUlke = async (req, res) => {
  try {
    const { ad, bolgeId } = req.body;
    const ulke = await Ulke.findByIdAndUpdate(
      req.params.id,
      { ad, bolgeId },
      { new: true, runValidators: true }
    );

    if (!ulke) {
      return res.status(404).json({
        message: "Ülke bulunamadı",
        data: null
      });
    }

    // ⚡ Cache'i temizle (fire and forget)
    dataLoader.invalidateUlke(req.params.id).catch(() => {});

    return res.json({
      message: "Ülke başarıyla güncellendi",
      data: ulke
    });
  } catch (err) {
    return res.status(400).json({
      message: "Güncelleme hatası",
      data: { error: err.message }
    });
  }
};

exports.deleteUlke = async (req, res) => {
  try {
    const ulke = await Ulke.findByIdAndDelete(req.params.id);
    if (!ulke) {
      return res.status(404).json({
        message: "Ülke bulunamadı",
        data: null
      });
    }

    // ⚡ Cache'den sil (fire and forget)
    dataLoader.invalidateUlke(req.params.id).catch(() => {});

    return res.json({
      message: "Ülke başarıyla silindi",
      data: ulke
    });
  } catch (err) {
    return res.status(400).json({
      message: "Silme hatası",
      data: { error: err.message }
    });
  }
};
