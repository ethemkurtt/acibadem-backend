const PersonelTalep = require("../models/personelTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");

/**
 * 📌 Yardımcı Fonksiyon – Route Kaydı Oluşturma
 */
const createRouteRecord = async (talepId, routeData, soforDurumu) => {
  if (soforDurumu === "Şoförsüz") {
    return await Routes.create({
      hastaId: talepId,
      pickup: { date: routeData.pickup?.date || null },
      drop: { date: routeData.drop?.date || null },
    });
  } else {
    return await Routes.create({
      ...routeData,
      hastaId: talepId,
    });
  }
};

/**
 * ✅ POST – Yeni Personel Talep Oluştur
 */
exports.createPersonelTalep = async (req, res) => {
  try {
    const { companions = [], routes = [], soforDurumu, ...talepData } = req.body;

    // 1️⃣ Ana Talep Kaydı
    const newTalep = await PersonelTalep.create({
      ...talepData,
      soforDurumu,
    });

    // 2️⃣ Refakatçileri Kaydet
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await Companions.create({ ...c, hastaId: newTalep._id });
        return saved._id;
      })
    );

    // 3️⃣ Rotaları Kaydet
    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(newTalep._id, r, soforDurumu))
    ).then((records) => records.map((r) => r._id));

    // 4️⃣ Talep Güncelle
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    await newTalep.save();

    res.status(201).json(newTalep);
  } catch (err) {
    console.error("❌ Personel Talep Oluşturma Hatası:", err);
    res.status(500).json({ error: "Oluşturma hatası", details: err.message });
  }
};

/**
 * ✅ GET – Tüm Personel Talepleri
 */
exports.getAllPersonelTalepleri = async (req, res) => {
  try {
    const list = await PersonelTalep.find()
      .populate("companions")
      .populate("routes");
    res.json(list);
  } catch (err) {
    console.error("❌ Listeleme Hatası:", err);
    res.status(500).json({ error: "Listeleme hatası", details: err.message });
  }
};

/**
 * ✅ GET – Tek Personel Talep (ID ile)
 */
exports.getPersonelTalepById = async (req, res) => {
  try {
    const talep = await PersonelTalep.findById(req.params.id)
      .populate("companions")
      .populate("routes");

    if (!talep) return res.status(404).json({ error: "Talep bulunamadı" });

    res.json(talep);
  } catch (err) {
    console.error("❌ Getirme Hatası:", err);
    res.status(500).json({ error: "Getirme hatası", details: err.message });
  }
};

/**
 * ✅ PUT – Talep Güncelle (ID ile)
 */
exports.updatePersonelTalep = async (req, res) => {
  try {
    const { companions = [], routes = [], soforDurumu, ...talepData } = req.body;
    const talepId = req.params.id;

    // 1️⃣ Eski refakatçi ve rotaları sil
    await Promise.all([
      Companions.deleteMany({ hastaId: talepId }),
      Routes.deleteMany({ hastaId: talepId }),
    ]);

    // 2️⃣ Yeni refakatçileri kaydet
    const companionIds = await Promise.all(
      companions.map(async (c) => {
        const saved = await Companions.create({ ...c, hastaId: talepId });
        return saved._id;
      })
    );

    // 3️⃣ Yeni rotaları kaydet
    const routeIds = await Promise.all(
      routes.map((r) => createRouteRecord(talepId, r, soforDurumu))
    ).then((records) => records.map((r) => r._id));

    // 4️⃣ Ana talebi güncelle
    const updated = await PersonelTalep.findByIdAndUpdate(
      talepId,
      { ...talepData, soforDurumu, companions: companionIds, routes: routeIds },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Talep bulunamadı" });

    res.json(updated);
  } catch (err) {
    console.error("❌ Güncelleme Hatası:", err);
    res.status(500).json({ error: "Güncelleme hatası", details: err.message });
  }
};

/**
 * ✅ DELETE – Talep Sil (ID ile)
 */
exports.deletePersonelTalep = async (req, res) => {
  try {
    const talepId = req.params.id;

    await Promise.all([
      Companions.deleteMany({ hastaId: talepId }),
      Routes.deleteMany({ hastaId: talepId }),
      PersonelTalep.findByIdAndDelete(talepId),
    ]);

    res.json({ message: "Talep ve ilişkili veriler silindi" });
  } catch (err) {
    console.error("❌ Silme Hatası:", err);
    res.status(500).json({ error: "Silme hatası", details: err.message });
  }
};

/**
 * 🧹 DELETE – Tüm Personel Taleplerini Temizle (Geliştirme Amaçlı)
 */
exports.clearAllPersonelTalepleri = async (req, res) => {
  try {
    await Promise.all([
      Companions.deleteMany({}),
      Routes.deleteMany({}),
      PersonelTalep.deleteMany({}),
    ]);

    res.json({ message: "Tüm personel talepleri ve ilişkili veriler silindi" });
  } catch (err) {
    console.error("❌ Temizleme Hatası:", err);
    res.status(500).json({ error: "Temizleme hatası", details: err.message });
  }
};
