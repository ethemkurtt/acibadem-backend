const mobilizAxios = require("../utils/axiosMobiliz");
const Plaka = require("../models/Plaka");
const mongoose = require("mongoose");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizePlate(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

exports.getEnrichedVehicles = async (req, res) => {
  try {
    console.log("🧾 DB'den PLAKA Set/Map çekiliyor...");
    // _id'yi da alıyoruz
    const plakaDocs = await Plaka.find({}, { plaka: 1 }).lean();

    // Set (filtreleme için) ve Map (plaka -> ObjectId) beraber
    const plakaSet = new Set();
    const plakaIdMap = new Map();
    for (const p of plakaDocs) {
      const np = normalizePlate(p.plaka);
      if (!np) continue;
      plakaSet.add(np);
      plakaIdMap.set(np, p._id); // <-- plakaya karşılık gelen ObjectId
    }

    if (plakaSet.size === 0) {
      console.warn("⚠️ Plaka koleksiyonunda kayıt yok. Boş liste döndürülüyor.");
      return res.json([]);
    }

    console.log("🚗 VEHICLES alınıyor...");
    const vehiclesRes = await mobilizAxios.get("/vehicles");

    console.log("🧑‍✈️ DRIVERS alınıyor...");
    const driversRes = await mobilizAxios.get("/drivers");
    await sleep(300);

    console.log("🚛 FLEETS alınıyor...");
    const fleetsRes = await mobilizAxios.get("/fleets");
    await sleep(300);

    console.log("📂 GROUPS alınıyor...");
    const groupsRes = await mobilizAxios.get("/groups");

    // Sadece DB'deki plakalara ait araçları al
    const vehicles = (vehiclesRes.data.result || []).filter(v => {
      const np = normalizePlate(v.plate);
      return np && plakaSet.has(np);
    });

    const fleets = fleetsRes.data.result || [];
    const groups = groupsRes.data.result || [];
    const drivers = driversRes.data.result || [];

    // (İstersen ufak optimizasyon: id->entity map’leri)
    const fleetMap = new Map(fleets.map(f => [f.fleetId, f]));
    const groupMap = new Map(groups.map(g => [g.groupId, g]));
    const driverByPlate = new Map(drivers.map(d => [normalizePlate(d.plate), d]));

    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const { fleetId, groupId, muId, networkId, plate } = v;

        if (!fleetId || !groupId || !muId || !networkId || !plate) {
          console.warn(`❌ Eksik parametreli araç (skip): ${JSON.stringify(v)}`);
          return null;
        }

        const np = normalizePlate(plate);
        const fleet = fleetMap.get(fleetId);
        const group = groupMap.get(groupId);
        const driver = driverByPlate.get(np);

        // Plaka ObjectId'yi ekliyoruz
        const plakaId = plakaIdMap.get(np) || null;

        return {
          plakaId,           // <-- İSTENEN: Plaka collection ObjectId
          plate: np,         // normalize edilmiş plaka
          fleet: fleet?.fleetName || null,
          group: group?.groupName || null,
          muId,
          brand: v.brandName || null,
          model: v.modelName || null,
          driver: driver ? `${driver.firstName} ${driver.lastName}` : null,
        };
      })
    );

    const filtered = enriched.filter(Boolean);
    res.json(filtered);

  } catch (err) {
    console.error("❌ Araç listesi hatası:", err.message);
    res.status(500).json({ error: "Araçlar alınamadı." });
  }
};
