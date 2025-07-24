const mobilizAxios = require("../utils/axiosMobiliz");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.getEnrichedVehicles = async (req, res) => {
  try {
    console.log("🚗 VEHICLES alınıyor...");
    const vehiclesRes = await mobilizAxios.get("/vehicles");

    console.log("🧑‍✈️ DRIVERS alınıyor...");
    const driversRes = await mobilizAxios.get("/drivers");

    // sadece azıcık bekle, çökmemesi için
    await sleep(300);

    console.log("🚛 FLEETS alınıyor...");
    const fleetsRes = await mobilizAxios.get("/fleets");

    await sleep(300);

    console.log("📂 GROUPS alınıyor...");
    const groupsRes = await mobilizAxios.get("/groups");

    // aynı işlem devam eder...
    const vehicles = vehiclesRes.data.result || [];
    const fleets = fleetsRes.data.result || [];
    const groups = groupsRes.data.result || [];
    const drivers = driversRes.data.result || [];

    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const { fleetId, groupId, muId, networkId, plate } = v;

        if (!fleetId || !groupId || !muId || !networkId || !plate) {
          console.warn(`❌ Eksik parametreli araç: ${JSON.stringify(v)}`);
          return null;
        }

        const fleet = fleets.find(f => f.fleetId === fleetId);
        const group = groups.find(g => g.groupId === groupId);
        const driver = drivers.find(d => d.plate === plate);

        return {
          plate,
          fleet: fleet?.fleetName || null,
          group: group?.groupName || null,
          muId,
          brand: v.brandName || null,
          model: v.modelName || null,
          driver: driver ? `${driver.firstName} ${driver.lastName}` : null,
        };
      })
    );

    const filtered = enriched.filter(item => item !== null);
    res.json(filtered);

  } catch (err) {
    console.error("❌ Araç listesi hatası:", err.message);
    res.status(500).json({ error: "Araçlar alınamadı." });
  }
};
