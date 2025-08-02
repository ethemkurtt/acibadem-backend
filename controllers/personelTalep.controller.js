const PersonelTalep = require("../models/personelTalep.model");
const Companions = require("../models/hastaTalepModels/companions.model");
const Routes = require("../models/hastaTalepModels/routes.model");

exports.createPersonelTalep = async (req, res) => {
  try {
    const { companions = [], routes = [], soforDurumu, ...talepData } = req.body;

    // 1️⃣ Personel Talep oluştur
    const newTalep = await PersonelTalep.create({
      ...talepData,
      soforDurumu,
    });

    // 2️⃣ Refakatçiler ekle
    const companionIds = [];
    for (const c of companions) {
      const saved = await Companions.create({ ...c, hastaId: newTalep._id });
      companionIds.push(saved._id);
    }

    // 3️⃣ Routes ekle
    const routeIds = [];
    for (const r of routes) {
      // Şoförsüz ise pickup/drop içeriği minimum olmalı
      const routeData =
        soforDurumu === "Şoförsüz"
          ? { pickup: { date: r.pickup?.date }, drop: { date: r.drop?.date }, hastaId: newTalep._id }
          : { ...r, hastaId: newTalep._id };

      const saved = await Routes.create(routeData);
      routeIds.push(saved._id);
    }

    // 4️⃣ Talep güncelle
    newTalep.companions = companionIds;
    newTalep.routes = routeIds;
    await newTalep.save();

    res.status(201).json(newTalep);
  } catch (err) {
    console.error("❌ Personel Talep Hatası:", err);
    res.status(500).json({ error: err.message });
  }
};
