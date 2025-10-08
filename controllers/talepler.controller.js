// controllers/talepler.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const doc = await Talepler.create(body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: "Talep oluşturulamadı", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    // basit filtreler: requestType, sofor, lokasyon, tarih aralığı
    const {
      requestType,
      sofor,
      lokasyon,
      atamaDurumu,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const q = {};
    if (requestType) q.requestType = requestType;
    if (atamaDurumu) q.atamaDurumu = atamaDurumu;
    if (sofor && isValidObjectId(sofor)) q.sofor = sofor;
    if (lokasyon && isValidObjectId(lokasyon)) q.lokasyon = lokasyon;

    if (startDate || endDate) {
      q.transferTarihi = {};
      if (startDate) q.transferTarihi.$gte = new Date(startDate);
      if (endDate) q.transferTarihi.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Talepler.find(q)
        .sort({ transferTarihi: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("lokasyon sofor arac talepEdenId atamaYapanId lokasyonSonDegistirenId"),
      Talepler.countDocuments(q),
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items,
    });
  } catch (err) {
    res.status(500).json({ message: "Talepler listelenemedi", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const doc = await Talepler.findById(id).populate(
      "lokasyon sofor arac talepEdenId atamaYapanId lokasyonSonDegistirenId"
    );
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Talep getirilemedi", error: err.message });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const updated = await Talepler.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Talep güncellenemedi", error: err.message });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const deleted = await Talepler.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json({ message: "Silindi", id });
  } catch (err) {
    res.status(500).json({ message: "Talep silinemedi", error: err.message });
  }
};
const isId = (id) => mongoose.isValidObjectId(id);

// GET /talepler/:id/full
exports.getFullById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) {
      return res.status(400).json({ ok: false, message: "Geçersiz id" });
    }

    // 1) Ana talep
    const talep = await Talepler.findById(id)
      .populate([
        { path: "lokasyon" },
        { path: "arac" },
        { path: "sofor" },
        { path: "talepEdenId" },
        { path: "atamaYapanId" },
        { path: "lokasyonSonDegistirenId" },
      ])
      .lean();

    if (!talep) {
      return res.status(404).json({ ok: false, message: "Talep bulunamadı" });
    }

    // 2) Tip-özel detay + alt koleksiyonlar
    let detay = null;
    let companions = [];
    let routes = [];
    let notificationPerson = null;

    if (talep.requestType === "hasta") {
      // a) Hasta detayı (varsa)
      detay = await HastaDetay.findOne({ talep_id: id })
        .populate(["companions", "routes", "notificationPerson"])
        .lean();

      // b) Fallback: Detay boşsa alt koleksiyonlardan çek
      if (!detay || !Array.isArray(detay.companions) || detay.companions.length === 0) {
        companions = await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] }).lean();
      } else {
        companions = detay.companions;
      }

      if (!detay || !Array.isArray(detay.routes) || detay.routes.length === 0) {
        routes = await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] }).lean();
      } else {
        routes = detay.routes;
      }

      if (!detay || !detay.notificationPerson) {
        notificationPerson = await NotificationPerson.findOne({
          $or: [{ talep_id: id }, { talepId: id }],
        }).lean();
      } else {
        notificationPerson = detay.notificationPerson;
      }
    } else {
      // personel/misafir vs. için tip-özel detay olmayabilir
      detay = null;
      companions = await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] }).lean();
      routes = await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] }).lean();
      notificationPerson = await NotificationPerson.findOne({
        $or: [{ talep_id: id }, { talepId: id }],
      }).lean();
    }

    return res.json({
      ok: true,
      data: {
        talep,
        detay,
        companions,
        routes,
        notificationPerson,
      },
    });
  } catch (err) {
    console.error("getFullById error:", err);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};