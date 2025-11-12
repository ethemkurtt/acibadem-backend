// utils/dataLoader.js
const cacheService = require("./cacheService");
const mongoose = require("mongoose");

/**
 * Statik verileri cache'den veya DB'den yükleyen servis
 * Otel, Hastane, Havalimanı, Ülke, Bölge, Lokasyon gibi sık değişmeyen veriler için
 */

// Cache TTL değerleri (saniye)
const CACHE_TTL = {
  LOKASYON: 86400,  // 24 saat
  BOLGE: 86400,     // 24 saat
  ULKE: 86400,      // 24 saat
  OTEL: 21600,      // 6 saat
  HASTANE: 21600,   // 6 saat
  HAVALIMANI: 21600, // 6 saat
  USER: 1800,       // 30 dakika
  PLAKA: 3600,      // 1 saat
};

// Cache key prefixleri
const CACHE_PREFIX = {
  LOKASYON: "lokasyon:",
  LOKASYON_ALL: "lokasyon:all",
  BOLGE: "bolge:",
  BOLGE_ALL: "bolge:all",
  ULKE: "ulke:",
  ULKE_ALL: "ulke:all",
  OTEL: "otel:",
  HASTANE: "hastane:",
  HAVALIMANI: "havalimani:",
  USER: "user:",
  PLAKA: "plaka:",
};

/**
 * Model'leri lazy load et (circular dependency önlemek için)
 */
const getModel = (() => {
  const cache = {};
  return (name) => {
    if (cache[name]) return cache[name];
    
    try {
      switch (name) {
        case "Lokasyon":
          cache[name] = require("../models/lokasyon.model");
          break;
        case "Bolge":
          cache[name] = require("../models/bolge.model");
          break;
        case "Ulke":
          cache[name] = require("../models/ulke.model");
          break;
        case "Otel":
          cache[name] = require("../models/otel/otel.model.js");
          break;
        case "Hastane":
          cache[name] = require("../models/hastane/hastane.model");
          break;
        case "Havalimani":
          cache[name] = require("../models/havalimanı/havalimani.model.js");
          break;
        case "User":
          cache[name] = require("../models/user.model");
          break;
        case "Plaka":
          cache[name] = require("../models/Plaka");
          break;
        default:
          return null;
      }
      return cache[name];
    } catch (err) {
      console.error(`Model yüklenemedi (${name}):`, err.message);
      return null;
    }
  };
})();

/**
 * Lokasyon ID'den cache veya DB'den çek
 */
async function getLokasyonById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.LOKASYON + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Lokasyon = getModel("Lokasyon");
      if (!Lokasyon) return null;
      return await Lokasyon.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.LOKASYON
  );
}

/**
 * Bölge ID'den cache veya DB'den çek
 */
async function getBolgeById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.BOLGE + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Bolge = getModel("Bolge");
      if (!Bolge) return null;
      return await Bolge.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.BOLGE
  );
}

/**
 * Ülke ID'den cache veya DB'den çek
 */
async function getUlkeById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.ULKE + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Ulke = getModel("Ulke");
      if (!Ulke) return null;
      return await Ulke.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.ULKE
  );
}

/**
 * Otel ID'den cache veya DB'den çek
 */
async function getOtelById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.OTEL + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Otel = getModel("Otel");
      if (!Otel) return null;
      return await Otel.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.OTEL
  );
}

/**
 * Hastane ID'den cache veya DB'den çek
 */
async function getHastaneById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.HASTANE + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Hastane = getModel("Hastane");
      if (!Hastane) return null;
      return await Hastane.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.HASTANE
  );
}

/**
 * Havalimanı ID'den cache veya DB'den çek
 */
async function getHavalimaniById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.HAVALIMANI + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Havalimani = getModel("Havalimani");
      if (!Havalimani) return null;
      return await Havalimani.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.HAVALIMANI
  );
}

/**
 * User ID'den cache veya DB'den çek (hassas alanlar hariç)
 */
async function getUserById(id, selectFields = "-password -resetPasswordToken -resetPasswordExpires -__v") {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.USER + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const User = getModel("User");
      if (!User) return null;
      return await User.findById(id).select(selectFields).lean().catch(() => null);
    },
    CACHE_TTL.USER
  );
}

/**
 * Plaka (Vehicle) ID'den cache veya DB'den çek
 */
async function getPlakaById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const key = CACHE_PREFIX.PLAKA + id;
  
  return await cacheService.getOrSet(
    key,
    async () => {
      const Plaka = getModel("Plaka");
      if (!Plaka) return null;
      return await Plaka.findById(id).lean().catch(() => null);
    },
    CACHE_TTL.PLAKA
  );
}

/**
 * Toplu lokasyon ID'leri çek (batch)
 */
async function getLokasyonsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const validIds = ids.filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return [];

  // Cache'den dene
  const keys = validIds.map((id) => CACHE_PREFIX.LOKASYON + id);
  const cached = await cacheService.mget(keys);

  // Eksik olanları tespit et
  const missing = [];
  const idMap = new Map();
  
  validIds.forEach((id, idx) => {
    if (cached[idx]) {
      idMap.set(String(id), cached[idx]);
    } else {
      missing.push(id);
    }
  });

  // Eksikleri DB'den çek
  if (missing.length > 0) {
    const Lokasyon = getModel("Lokasyon");
    if (Lokasyon) {
      const docs = await Lokasyon.find({ _id: { $in: missing } }).lean().catch(() => []);
      
      // Cache'e yaz
      const toCache = docs.map((doc) => ({
        key: CACHE_PREFIX.LOKASYON + doc._id,
        value: doc,
      }));
      await cacheService.mset(toCache, CACHE_TTL.LOKASYON);

      // Map'e ekle
      docs.forEach((doc) => idMap.set(String(doc._id), doc));
    }
  }

  // Sıralı sonuç döndür
  return validIds.map((id) => idMap.get(String(id)) || null);
}

/**
 * Toplu user ID'leri çek (batch)
 */
async function getUsersByIds(ids, selectFields = "-password -resetPasswordToken -resetPasswordExpires -__v") {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const validIds = ids.filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return [];

  // Cache'den dene
  const keys = validIds.map((id) => CACHE_PREFIX.USER + id);
  const cached = await cacheService.mget(keys);

  // Eksik olanları tespit et
  const missing = [];
  const idMap = new Map();
  
  validIds.forEach((id, idx) => {
    if (cached[idx]) {
      idMap.set(String(id), cached[idx]);
    } else {
      missing.push(id);
    }
  });

  // Eksikleri DB'den çek
  if (missing.length > 0) {
    const User = getModel("User");
    if (User) {
      const docs = await User.find({ _id: { $in: missing } })
        .select(selectFields)
        .lean()
        .catch(() => []);
      
      // Cache'e yaz
      const toCache = docs.map((doc) => ({
        key: CACHE_PREFIX.USER + doc._id,
        value: doc,
      }));
      await cacheService.mset(toCache, CACHE_TTL.USER);

      // Map'e ekle
      docs.forEach((doc) => idMap.set(String(doc._id), doc));
    }
  }

  // Sıralı sonuç döndür
  return validIds.map((id) => idMap.get(String(id)) || null);
}

/**
 * Toplu plaka ID'leri çek (batch)
 */
async function getPlakasByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const validIds = ids.filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return [];

  // Cache'den dene
  const keys = validIds.map((id) => CACHE_PREFIX.PLAKA + id);
  const cached = await cacheService.mget(keys);

  // Eksik olanları tespit et
  const missing = [];
  const idMap = new Map();
  
  validIds.forEach((id, idx) => {
    if (cached[idx]) {
      idMap.set(String(id), cached[idx]);
    } else {
      missing.push(id);
    }
  });

  // Eksikleri DB'den çek
  if (missing.length > 0) {
    const Plaka = getModel("Plaka");
    if (Plaka) {
      const docs = await Plaka.find({ _id: { $in: missing } }).lean().catch(() => []);
      
      // Cache'e yaz
      const toCache = docs.map((doc) => ({
        key: CACHE_PREFIX.PLAKA + doc._id,
        value: doc,
      }));
      await cacheService.mset(toCache, CACHE_TTL.PLAKA);

      // Map'e ekle
      docs.forEach((doc) => idMap.set(String(doc._id), doc));
    }
  }

  // Sıralı sonuç döndür
  return validIds.map((id) => idMap.get(String(id)) || null);
}

/**
 * Lokasyon type ve ID'ye göre dokuman getir (Otel, Hastane, Havalimanı)
 */
async function getLocationDocument(type, locationId) {
  if (!type || !locationId) return null;

  const t = String(type).toLowerCase();
  
  switch (t) {
    case "otel":
      return await getOtelById(locationId);
    case "hastane":
      return await getHastaneById(locationId);
    case "havaalani":
    case "havalimani":
      return await getHavalimaniById(locationId);
    default:
      return null;
  }
}

/**
 * Toplu lokasyon type ve ID çiftleri için dökümanları getir (batch)
 */
async function getLocationDocuments(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Type'a göre grupla
  const byType = {
    otel: [],
    hastane: [],
    havalimani: [],
  };

  items.forEach((item, idx) => {
    if (!item || !item.type || !item.locationId) return;
    const t = String(item.type).toLowerCase();
    
    if (t === "otel") byType.otel.push({ idx, id: item.locationId });
    else if (t === "hastane") byType.hastane.push({ idx, id: item.locationId });
    else if (t === "havaalani" || t === "havalimani") byType.havalimani.push({ idx, id: item.locationId });
  });

  // Her type için batch çek
  const results = new Array(items.length).fill(null);

  await Promise.all([
    // Otel
    (async () => {
      if (byType.otel.length === 0) return;
      const ids = byType.otel.map((x) => x.id);
      const keys = ids.map((id) => CACHE_PREFIX.OTEL + id);
      const cached = await cacheService.mget(keys);
      
      const missing = [];
      byType.otel.forEach((x, i) => {
        if (cached[i]) {
          results[x.idx] = cached[i];
        } else {
          missing.push(x);
        }
      });

      if (missing.length > 0) {
        const Otel = getModel("Otel");
        if (Otel) {
          const docs = await Otel.find({ _id: { $in: missing.map((x) => x.id) } }).lean().catch(() => []);
          const toCache = docs.map((doc) => ({ key: CACHE_PREFIX.OTEL + doc._id, value: doc }));
          await cacheService.mset(toCache, CACHE_TTL.OTEL);

          const docMap = new Map(docs.map((d) => [String(d._id), d]));
          missing.forEach((x) => {
            results[x.idx] = docMap.get(String(x.id)) || null;
          });
        }
      }
    })(),

    // Hastane
    (async () => {
      if (byType.hastane.length === 0) return;
      const ids = byType.hastane.map((x) => x.id);
      const keys = ids.map((id) => CACHE_PREFIX.HASTANE + id);
      const cached = await cacheService.mget(keys);
      
      const missing = [];
      byType.hastane.forEach((x, i) => {
        if (cached[i]) {
          results[x.idx] = cached[i];
        } else {
          missing.push(x);
        }
      });

      if (missing.length > 0) {
        const Hastane = getModel("Hastane");
        if (Hastane) {
          const docs = await Hastane.find({ _id: { $in: missing.map((x) => x.id) } }).lean().catch(() => []);
          const toCache = docs.map((doc) => ({ key: CACHE_PREFIX.HASTANE + doc._id, value: doc }));
          await cacheService.mset(toCache, CACHE_TTL.HASTANE);

          const docMap = new Map(docs.map((d) => [String(d._id), d]));
          missing.forEach((x) => {
            results[x.idx] = docMap.get(String(x.id)) || null;
          });
        }
      }
    })(),

    // Havalimanı
    (async () => {
      if (byType.havalimani.length === 0) return;
      const ids = byType.havalimani.map((x) => x.id);
      const keys = ids.map((id) => CACHE_PREFIX.HAVALIMANI + id);
      const cached = await cacheService.mget(keys);
      
      const missing = [];
      byType.havalimani.forEach((x, i) => {
        if (cached[i]) {
          results[x.idx] = cached[i];
        } else {
          missing.push(x);
        }
      });

      if (missing.length > 0) {
        const Havalimani = getModel("Havalimani");
        if (Havalimani) {
          const docs = await Havalimani.find({ _id: { $in: missing.map((x) => x.id) } }).lean().catch(() => []);
          const toCache = docs.map((doc) => ({ key: CACHE_PREFIX.HAVALIMANI + doc._id, value: doc }));
          await cacheService.mset(toCache, CACHE_TTL.HAVALIMANI);

          const docMap = new Map(docs.map((d) => [String(d._id), d]));
          missing.forEach((x) => {
            results[x.idx] = docMap.get(String(x.id)) || null;
          });
        }
      }
    })(),
  ]);

  return results;
}

/**
 * Cache invalidation helper'ları
 */
async function invalidateLokasyon(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.LOKASYON + id);
  await cacheService.del(CACHE_PREFIX.LOKASYON_ALL);
}

async function invalidateBolge(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.BOLGE + id);
  await cacheService.del(CACHE_PREFIX.BOLGE_ALL);
}

async function invalidateUlke(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.ULKE + id);
  await cacheService.del(CACHE_PREFIX.ULKE_ALL);
}

async function invalidateOtel(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.OTEL + id);
}

async function invalidateHastane(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.HASTANE + id);
}

async function invalidateHavalimani(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.HAVALIMANI + id);
}

async function invalidateUser(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.USER + id);
}

async function invalidatePlaka(id) {
  if (!id) return;
  await cacheService.del(CACHE_PREFIX.PLAKA + id);
}

module.exports = {
  // Single getters
  getLokasyonById,
  getBolgeById,
  getUlkeById,
  getOtelById,
  getHastaneById,
  getHavalimaniById,
  getUserById,
  getPlakaById,
  getLocationDocument,

  // Batch getters
  getLokasyonsByIds,
  getUsersByIds,
  getPlakasByIds,
  getLocationDocuments,

  // Invalidation
  invalidateLokasyon,
  invalidateBolge,
  invalidateUlke,
  invalidateOtel,
  invalidateHastane,
  invalidateHavalimani,
  invalidateUser,
  invalidatePlaka,
};

