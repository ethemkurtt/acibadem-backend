// utils/cacheService.js
const redis = require("redis");

class CacheService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.defaultTTL = 3600; // 1 saat
  }

  async connect() {
    try {
      // Redis URL yoksa cache olmadan çalış
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.log("⚠️  Redis yapılandırması bulunamadı. Cache devre dışı.");
        return;
      }

      const redisConfig = process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
          };

      this.client = redis.createClient(redisConfig);

      this.client.on("error", (err) => {
        console.error("❌ Redis bağlantı hatası:", err.message);
        this.isReady = false;
      });

      this.client.on("connect", () => {
        console.log("🔄 Redis'e bağlanıyor...");
      });

      this.client.on("ready", () => {
        console.log("✅ Redis bağlantısı başarılı");
        this.isReady = true;
      });

      await this.client.connect();
    } catch (err) {
      console.error("❌ Redis başlatılamadı:", err.message);
      this.client = null;
      this.isReady = false;
    }
  }

  /**
   * Cache'den veri al
   */
  async get(key) {
    if (!this.isReady || !this.client) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Cache GET hatası (${key}):`, err.message);
      return null;
    }
  }

  /**
   * Cache'e veri yaz
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isReady || !this.client) return false;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Cache SET hatası (${key}):`, err.message);
      return false;
    }
  }

  /**
   * Cache'den sil
   */
  async del(key) {
    if (!this.isReady || !this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      console.error(`Cache DEL hatası (${key}):`, err.message);
      return false;
    }
  }

  /**
   * Pattern'e göre cache temizle
   */
  async delPattern(pattern) {
    if (!this.isReady || !this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (err) {
      console.error(`Cache DEL PATTERN hatası (${pattern}):`, err.message);
      return false;
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async flush() {
    if (!this.isReady || !this.client) return false;

    try {
      await this.client.flushAll();
      return true;
    } catch (err) {
      console.error("Cache FLUSH hatası:", err.message);
      return false;
    }
  }

  /**
   * Multiple key'leri tek seferde getir (pipeline)
   */
  async mget(keys) {
    if (!this.isReady || !this.client || !keys.length) return [];

    try {
      const values = await this.client.mGet(keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (err) {
      console.error("Cache MGET hatası:", err.message);
      return keys.map(() => null);
    }
  }

  /**
   * Multiple key'leri tek seferde set et (pipeline)
   */
  async mset(entries, ttl = this.defaultTTL) {
    if (!this.isReady || !this.client || !entries.length) return false;

    try {
      const pipeline = this.client.multi();
      
      for (const { key, value } of entries) {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (err) {
      console.error("Cache MSET hatası:", err.message);
      return false;
    }
  }

  /**
   * Cache'de yoksa veritabanından çek ve cache'e yaz
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Önce cache'den dene
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache'de yok, veritabanından çek
    const data = await fetchFn();
    
    // Cache'e yaz (fire and forget)
    if (data !== null && data !== undefined) {
      this.set(key, data, ttl).catch(() => {});
    }

    return data;
  }

  /**
   * Bağlantıyı kapat
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log("Redis bağlantısı kapatıldı");
      } catch (err) {
        console.error("Redis kapatma hatası:", err.message);
      }
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

