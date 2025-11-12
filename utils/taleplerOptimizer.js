// utils/taleplerOptimizer.js
/**
 * Talepler için optimizasyon fonksiyonları
 * N+1 query problemlerini çözer ve batch işlemler yapar
 */

const dataLoader = require("./dataLoader");

/**
 * Talepler listesine populate verilerini batch olarak ekle
 */
async function populateTaleplerBatch(talepler) {
  if (!Array.isArray(talepler) || talepler.length === 0) return talepler;

  // ID'leri topla
  const lokasyonIds = [];
  const userIds = [];
  const plakaIds = [];

  talepler.forEach((t) => {
    if (t.lokasyon) lokasyonIds.push(t.lokasyon);
    if (t.sofor) userIds.push(t.sofor);
    if (t.arac) plakaIds.push(t.arac);
    if (t.talepEdenId) userIds.push(t.talepEdenId);
    if (t.atamaYapanId) userIds.push(t.atamaYapanId);
    if (t.lokasyonSonDegistirenId) userIds.push(t.lokasyonSonDegistirenId);
  });

  // Unique yap
  const uniqueLokasyonIds = [...new Set(lokasyonIds.filter(Boolean).map(String))];
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
  const uniquePlakaIds = [...new Set(plakaIds.filter(Boolean).map(String))];

  // Batch olarak çek
  const [lokasyonMap, userMap, plakaMap] = await Promise.all([
    (async () => {
      if (uniqueLokasyonIds.length === 0) return new Map();
      const docs = await dataLoader.getLokasyonsByIds(uniqueLokasyonIds);
      const map = new Map();
      docs.forEach((doc, idx) => {
        if (doc) map.set(uniqueLokasyonIds[idx], doc);
      });
      return map;
    })(),
    (async () => {
      if (uniqueUserIds.length === 0) return new Map();
      const docs = await dataLoader.getUsersByIds(uniqueUserIds);
      const map = new Map();
      docs.forEach((doc, idx) => {
        if (doc) map.set(uniqueUserIds[idx], doc);
      });
      return map;
    })(),
    (async () => {
      if (uniquePlakaIds.length === 0) return new Map();
      const docs = await dataLoader.getPlakasByIds(uniquePlakaIds);
      const map = new Map();
      docs.forEach((doc, idx) => {
        if (doc) map.set(uniquePlakaIds[idx], doc);
      });
      return map;
    })(),
  ]);

  // Populate et
  return talepler.map((t) => {
    const populated = { ...t };
    
    if (t.lokasyon) {
      populated.lokasyon = lokasyonMap.get(String(t.lokasyon)) || t.lokasyon;
    }
    if (t.sofor) {
      populated.sofor = userMap.get(String(t.sofor)) || t.sofor;
    }
    if (t.arac) {
      populated.arac = plakaMap.get(String(t.arac)) || t.arac;
    }
    if (t.talepEdenId) {
      populated.talepEdenId = userMap.get(String(t.talepEdenId)) || t.talepEdenId;
    }
    if (t.atamaYapanId) {
      populated.atamaYapanId = userMap.get(String(t.atamaYapanId)) || t.atamaYapanId;
    }
    if (t.lokasyonSonDegistirenId) {
      populated.lokasyonSonDegistirenId = userMap.get(String(t.lokasyonSonDegistirenId)) || t.lokasyonSonDegistirenId;
    }

    return populated;
  });
}

/**
 * Routes içindeki pickup/drop için koordinat bilgilerini batch olarak ekle
 */
async function addKordinatToRoutesBatch(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return routes;

  // Tüm location reference'ları topla
  const locationRefs = [];
  const refMap = new Map(); // index -> [route_idx, pickup/drop, item_idx]

  routes.forEach((route, routeIdx) => {
    if (!route) return;

    // Pickup
    const pickupArr = Array.isArray(route.pickup) ? route.pickup : route.pickup ? [route.pickup] : [];
    pickupArr.forEach((p, itemIdx) => {
      if (p && p.type && p.locationId) {
        const refIdx = locationRefs.length;
        locationRefs.push({ type: p.type, locationId: p.locationId });
        refMap.set(refIdx, { routeIdx, field: "pickup", itemIdx, isArray: Array.isArray(route.pickup) });
      }
    });

    // Drop
    const dropArr = Array.isArray(route.drop) ? route.drop : route.drop ? [route.drop] : [];
    dropArr.forEach((d, itemIdx) => {
      if (d && d.type && d.locationId) {
        const refIdx = locationRefs.length;
        locationRefs.push({ type: d.type, locationId: d.locationId });
        refMap.set(refIdx, { routeIdx, field: "drop", itemIdx, isArray: Array.isArray(route.drop) });
      }
    });
  });

  if (locationRefs.length === 0) return routes;

  // Batch olarak location dökümanlarını çek
  const locationDocs = await dataLoader.getLocationDocuments(locationRefs);

  // Yeni routes array'i oluştur
  const newRoutes = routes.map((route) => {
    if (!route) return route;
    return {
      ...route,
      pickup: Array.isArray(route.pickup) 
        ? route.pickup.map((p) => ({ ...p }))
        : route.pickup ? { ...route.pickup } : null,
      drop: Array.isArray(route.drop)
        ? route.drop.map((d) => ({ ...d }))
        : route.drop ? { ...route.drop } : null,
    };
  });

  // Koordinatları ekle
  refMap.forEach((ref, refIdx) => {
    const doc = locationDocs[refIdx];
    if (!doc) return;

    const route = newRoutes[ref.routeIdx];
    if (!route) return;

    const kordinat = doc.kordinat || null;
    
    // Name field belirleme
    let nameField = null;
    const locRef = locationRefs[refIdx];
    const t = String(locRef.type || "").toLowerCase();
    if (t === "otel") nameField = "otelAdi";
    else if (t === "hastane") nameField = "lokasyon"; // Hastane model'inde ad alanı "lokasyon"
    else if (t === "havaalani" || t === "havalimani") nameField = "adi";

    const locationName = nameField && doc[nameField] ? doc[nameField] : null;

    // Değeri set et
    if (ref.isArray) {
      const arr = route[ref.field];
      if (arr && arr[ref.itemIdx]) {
        arr[ref.itemIdx].kordinat = kordinat;
        if (locationName && !arr[ref.itemIdx].locationName) {
          arr[ref.itemIdx].locationName = locationName;
        }
      }
    } else {
      const obj = route[ref.field];
      if (obj) {
        obj.kordinat = kordinat;
        if (locationName && !obj.locationName) {
          obj.locationName = locationName;
        }
      }
    }
  });

  return newRoutes;
}

/**
 * Detay modellerindeki bölge ve ülke bilgilerini batch olarak populate et
 */
async function populateDetayBatch(detayList) {
  if (!Array.isArray(detayList) || detayList.length === 0) return detayList;

  // ID'leri topla
  const bolgeIds = [];
  const countryIds = [];

  detayList.forEach((d) => {
    if (d.bolge) bolgeIds.push(d.bolge);
    if (d.country) countryIds.push(d.country);
  });

  // Unique yap
  const uniqueBolgeIds = [...new Set(bolgeIds.filter(Boolean).map(String))];
  const uniqueCountryIds = [...new Set(countryIds.filter(Boolean).map(String))];

  // Batch olarak çek
  const [bolgeMap, countryMap] = await Promise.all([
    (async () => {
      if (uniqueBolgeIds.length === 0) return new Map();
      const docs = await Promise.all(
        uniqueBolgeIds.map((id) => dataLoader.getBolgeById(id))
      );
      const map = new Map();
      docs.forEach((doc, idx) => {
        if (doc) map.set(uniqueBolgeIds[idx], doc);
      });
      return map;
    })(),
    (async () => {
      if (uniqueCountryIds.length === 0) return new Map();
      const docs = await Promise.all(
        uniqueCountryIds.map((id) => dataLoader.getUlkeById(id))
      );
      const map = new Map();
      docs.forEach((doc, idx) => {
        if (doc) map.set(uniqueCountryIds[idx], doc);
      });
      return map;
    })(),
  ]);

  // Populate et
  return detayList.map((d) => {
    const populated = { ...d };
    
    if (d.bolge) {
      populated.bolge = bolgeMap.get(String(d.bolge)) || d.bolge;
    }
    if (d.country) {
      populated.country = countryMap.get(String(d.country)) || d.country;
    }

    return populated;
  });
}

/**
 * Talepler + Detay birleşimini optimize et
 * aracTalep, aracIsEmri, isAtamalarim gibi endpoint'ler için
 */
async function optimizeTaleplerWithDetay(rawTalepler, detayMap) {
  if (!Array.isArray(rawTalepler) || rawTalepler.length === 0) return [];

  // 1. Talepler için populate (batch)
  const populatedTalepler = await populateTaleplerBatch(rawTalepler);

  // 2. Detay'daki routes için koordinat ekleme (batch)
  const needsCoord = new Set(["hasta", "misafir", "personel"]);
  
  for (const [talepId, detay] of detayMap.entries()) {
    if (!detay || !detay.routes || detay.routes.length === 0) continue;
    
    const talep = rawTalepler.find((t) => String(t._id) === talepId);
    if (!talep) continue;

    const rt = (talep.requestType || "").toLowerCase();
    if (needsCoord.has(rt)) {
      detay.routes = await addKordinatToRoutesBatch(detay.routes);
    }
  }

  // 3. Detay için bolge/country populate (batch)
  const allDetay = Array.from(detayMap.values()).filter(Boolean);
  if (allDetay.length > 0) {
    const populatedDetay = await populateDetayBatch(allDetay);
    
    // Map'i güncelle
    let idx = 0;
    for (const [talepId, detay] of detayMap.entries()) {
      if (detay) {
        detayMap.set(talepId, populatedDetay[idx]);
        idx++;
      }
    }
  }

  // 4. Birleştir
  return populatedTalepler.map((talep) => {
    const detay = detayMap.get(String(talep._id)) || null;
    return { ...talep, detay };
  });
}

module.exports = {
  populateTaleplerBatch,
  addKordinatToRoutesBatch,
  populateDetayBatch,
  optimizeTaleplerWithDetay,
};

