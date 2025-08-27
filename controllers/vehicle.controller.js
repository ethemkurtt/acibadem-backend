const mobilizAxios = require("../utils/axiosMobiliz");
const Plaka = require("../models/Plaka"); // <-- EKLENDİ

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Büyük/küçük harf duyarsız ve boşlukları tekleyen normalize
function normalizePlate(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  // Eğer tire/nokta vs. çıkarılsın dersen şu satırı da ekleyebilirsin:
  // .replace(/[^A-Z0-9 ]/g, "")
}

exports.getEnrichedVehicles = async (req, res) => {
  try {
    console.log("🧾 DB'den PLAKA Set'i çekiliyor...");
    const plakaDocs = await Plaka.find({}, { plaka: 1, _id: 0 }).lean();
    const plakaSet = new Set(plakaDocs.map(p => normalizePlate(p.plaka)));

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

    const vehicles = (vehiclesRes.data.result || []).filter(v => {
      // Sadece DB'deki plaka setinde olan araçları al
      const np = normalizePlate(v.plate);
      return np && plakaSet.has(np);
    });

    const fleets = fleetsRes.data.result || [];
    const groups = groupsRes.data.result || [];
    const drivers = driversRes.data.result || [];

    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const { fleetId, groupId, muId, networkId, plate } = v;

        if (!fleetId || !groupId || !muId || !networkId || !plate) {
          console.warn(`❌ Eksik parametreli araç (skip): ${JSON.stringify(v)}`);
          return null;
        }

        const fleet = fleets.find(f => f.fleetId === fleetId);
        const group = groups.find(g => g.groupId === groupId);

        const np = normalizePlate(plate);
        const driver = drivers.find(d => normalizePlate(d.plate) === np);

        return {
          plate: np, // normalize edilmiş plaka döndürüyoruz
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
