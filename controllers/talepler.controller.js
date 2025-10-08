// controllers/talepler.controller.js
const mongoose = require("mongoose");
const Talepler = require("../models/talepler/talepler.model");

// 🔽 EKLENDİ: getFullById'de kullandıkların
const HastaDetay = require("../models/talepler/hastaTalepDetay.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");
const NotificationPerson = require("../models/hastaTalepModels/notificationPerson.model");
const PersonelDetay = require("../models/talepler/personelTalepDetay.model"); // << yeni
// Tek bir validator kullan
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const idsOnly = (arr) =>
  Array.isArray(arr)
    ? arr.map((x) => (x && typeof x === "object" && x._id ? x._id : x)).filter(Boolean)
    : [];
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const doc = await Talepler.create(body);
    res.status(201).json(doc);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Talep oluşturulamadı", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
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
    if (sofor && isId(sofor)) q.sofor = sofor;
    if (lokasyon && isId(lokasyon)) q.lokasyon = lokasyon;

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
        .populate(
          "lokasyon sofor arac talepEdenId atamaYapanId lokasyonSonDegistirenId"
        ),
      Talepler.countDocuments(q),
    ]);

    res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Talepler listelenemedi", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

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
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const updated = await Talepler.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Talep güncellenemedi", error: err.message });
  }
};

exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Geçersiz id" });

    const deleted = await Talepler.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Kayıt bulunamadı" });

    res.json({ message: "Silindi", id });
  } catch (err) {
    res.status(500).json({ message: "Talep silinemedi", error: err.message });
  }
};
const MisafirDetay = require("../models/talepler/misafirTalepDetay.model");
// GET /talepler/detail/:id  (tek kaydı, full detayla döner)

exports.getFullById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) {
      return res.status(400).json({ ok: false, message: "Geçersiz id" });
    }

    // cache kapat
    res.set("Cache-Control", "no-store");

    // Ana talep (POPULATE YOK, en sade hali)
    const talep = await Talepler.findById(id).select("-__v").lean();
    if (!talep) {
      return res.status(404).json({ ok: false, message: "Talep bulunamadı" });
    }

    let detay = null;
    let companions = [];
    let routes = [];
    let notificationPerson = null;

    if (talep.requestType === "hasta") {
      detay = await HastaDetay.findOne({ talep_id: id }).select("-__v").lean();

      if (detay?.companions?.length) {
        companions = idsOnly(detay.companions);
      } else {
        companions = (
          await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      if (detay?.routes?.length) {
        routes = idsOnly(detay.routes);
      } else {
        routes = (
          await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      if (detay?.notificationPerson) {
        notificationPerson =
          typeof detay.notificationPerson === "object"
            ? detay.notificationPerson._id
            : detay.notificationPerson;
      } else {
        const notif = await NotificationPerson.findOne({
          $or: [{ talep_id: id }, { talepId: id }],
        })
          .select("_id")
          .lean();
        notificationPerson = notif?._id || null;
      }
    } else if (talep.requestType === "personel") {
      detay = await PersonelDetay.findOne({ talep_id: id }).select("-__v").lean();

      if (detay?.companions?.length) {
        companions = idsOnly(detay.companions);
      } else {
        companions = (
          await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      if (detay?.routes?.length) {
        routes = idsOnly(detay.routes);
      } else {
        routes = (
          await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      const notif = await NotificationPerson.findOne({
        $or: [{ talep_id: id }, { talepId: id }],
      })
        .select("_id")
        .lean();
      notificationPerson = notif?._id || null;
    } else if (talep.requestType === "misafir") {
      detay = await MisafirDetay.findOne({ talep_id: id }).select("-__v").lean();

      if (detay?.companions?.length) {
        companions = idsOnly(detay.companions);
      } else {
        companions = (
          await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      if (detay?.routes?.length) {
        routes = idsOnly(detay.routes);
      } else {
        routes = (
          await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] })
            .select("_id")
            .lean()
        ).map((d) => d._id);
      }

      if (detay?.notificationPerson) {
        notificationPerson =
          typeof detay.notificationPerson === "object"
            ? detay.notificationPerson._id
            : detay.notificationPerson;
      } else {
        const notif = await NotificationPerson.findOne({
          $or: [{ talep_id: id }, { talepId: id }],
        })
          .select("_id")
          .lean();
        notificationPerson = notif?._id || null;
      }
    } else if (talep.requestType === "diger") {
      detay = await DigerDetay.findOne({ talep_id: id }).select("-__v").lean();

      // Bu tipte tip-özel ilişkiler yok; yine de varsa genel koleksiyonlardan sadece ID'leri döndür
      companions = (
        await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] })
          .select("_id")
          .lean()
      ).map((d) => d._id);

      routes = (
        await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] })
          .select("_id")
          .lean()
      ).map((d) => d._id);

      const notif = await NotificationPerson.findOne({
        $or: [{ talep_id: id }, { talepId: id }],
      })
        .select("_id")
        .lean();
      notificationPerson = notif?._id || null;
    } else {
      // Bilinmeyen tip → sadece ilişki ID'leri
      companions = (
        await Companions.find({ $or: [{ talep_id: id }, { talepId: id }] })
          .select("_id")
          .lean()
      ).map((d) => d._id);

      routes = (
        await Routes.find({ $or: [{ talep_id: id }, { talepId: id }] })
          .select("_id")
          .lean()
      ).map((d) => d._id);

      const notif = await NotificationPerson.findOne({
        $or: [{ talep_id: id }, { talepId: id }],
      })
        .select("_id")
        .lean();
      notificationPerson = notif?._id || null;
    }

    // ——— DÖNÜŞ ŞEKLİ (en sade) ———
    // data içinde talep objesi yok; talep alanları doğrudan data'da.
    // ayrıca: detal, companions (id[]), routes (id[]), notificationPerson (id|null)
    const data = {
      ...talep, // talebin tüm alanları direkt data altında
      detay: detay || null,
      companions,
      routes,
      notificationPerson,
    };

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("getFullById error:", err);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
};
