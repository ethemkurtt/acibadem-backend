const fs = require("fs");
const path = require("path");
const Bolge = require("../models/bolge.model");
const Ulke = require("../models/ulke.model");

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

    res.json({
      message: "JSON'dan veri başarıyla aktarıldı",
      addedRegions,
      addedCountries
    });
  } catch (err) {
    res.status(500).json({ message: "İçe aktarma hatası", error: err.message });
  }
};

///////////////////// 📌 BÖLGELER CRUD /////////////////////

exports.getBolgeler = async (req, res) => {
  const data = await Bolge.find().sort({ ad: 1 });
  res.json(data);
};

exports.createBolge = async (req, res) => {
  try {
    const bolge = await Bolge.create({ ad: req.body.ad });
    res.status(201).json(bolge);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBolge = async (req, res) => {
  try {
    const bolge = await Bolge.findByIdAndUpdate(req.params.id, { ad: req.body.ad }, { new: true });
    if (!bolge) return res.status(404).json({ message: "Bölge bulunamadı" });
    res.json(bolge);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBolge = async (req, res) => {
  const bolge = await Bolge.findByIdAndDelete(req.params.id);
  if (!bolge) return res.status(404).json({ message: "Bölge bulunamadı" });
  await Ulke.deleteMany({ bolgeId: bolge._id });
  res.json({ message: "Bölge ve bağlı ülkeler silindi" });
};

///////////////////// 📌 ÜLKELER CRUD /////////////////////

exports.getUlkeler = async (req, res) => {
  const filter = req.query.bolgeId ? { bolgeId: req.query.bolgeId } : {};
  const data = await Ulke.find(filter).populate("bolgeId", "ad").sort({ ad: 1 });
  res.json(data);
};

exports.getUlkeById = async (req, res) => {
  const data = await Ulke.findById(req.params.id).populate("bolgeId", "ad");
  if (!data) return res.status(404).json({ message: "Ülke bulunamadı" });
  res.json(data);
};

exports.createUlke = async (req, res) => {
  try {
    const { ad, bolgeId } = req.body;
    const ulke = await Ulke.create({ ad, bolgeId });
    res.status(201).json(ulke);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateUlke = async (req, res) => {
  try {
    const { ad, bolgeId } = req.body;
    const ulke = await Ulke.findByIdAndUpdate(req.params.id, { ad, bolgeId }, { new: true });
    if (!ulke) return res.status(404).json({ message: "Ülke bulunamadı" });
    res.json(ulke);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUlke = async (req, res) => {
  const ulke = await Ulke.findByIdAndDelete(req.params.id);
  if (!ulke) return res.status(404).json({ message: "Ülke bulunamadı" });
  res.json({ message: "Ülke silindi" });
};
