// controllers/user.controller.js
const User = require("../models/user.model");

// ⚡ Optimizasyon araçları
const dataLoader = require("../utils/dataLoader");

// Map/Mixed/Map-like -> plain object
function mapToPlain(objOrMap) {
  if (!objOrMap) return {};
  if (objOrMap instanceof Map) return Object.fromEntries(objOrMap);
  if (typeof objOrMap === "object" && !Array.isArray(objOrMap)) return { ...objOrMap };
  return {};
}

// RoleGroup + yetkiler dahil user cevabı
async function userResponse(user) {
  const RoleGroup = require("../models/roleGroup.model");

  // RoleGroup'u roleGroupId (string) ile bul
  const group = await RoleGroup.findOne({ roleGroupId: user.roleGroupId }).lean();

  // RoleGroup.yetkiler & User.yetkiler -> düz objeye çevir
  const groupYetkiler = group ? mapToPlain(group.yetkiler) : {};
  const userYetkiler  = mapToPlain(user.yetkiler);

  // lokasyon fallback (tekil lokasyonu diziye çevir)
  const lokDocs = (user.lokasyonlar && user.lokasyonlar.length)
    ? user.lokasyonlar
    : (user.lokasyon ? [user.lokasyon] : []);

  return {
    id: user._id,
    name: user.name,
    email: user.email,

    organizasyon: user.organizasyon || null,
    personelGrubu: user.personelGrubu || null,
    roleGroupId: user.roleGroupId,
    roleGroupName: group?.roleGroupName || null,

    // profil
    tc: user.tc,
    telefon: user.telefon,
    mail: user.mail,
    dogumTarihi: user.dogumTarihi,
    cinsiyet: user.cinsiyet,
    ehliyet: user.ehliyet,

    // referanslar
    departman: user.departman?._id || null,
    departmanName: user.departman?.ad || null,

    // lokasyonlar
    lokasyonlar: lokDocs.map(l => l?._id ?? l).filter(Boolean),
    lokasyonlarNames: lokDocs.map(l => l?.ad).filter(Boolean),

    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,

    // 🔵 Kullanıcının kendi yetkileri
    yetkiler: userYetkiler,

    // 🔵 RoleGroup bilgisi (+ grup yetkileri)
    roleGroup: group ? {
      roleGroupId: group.roleGroupId,
      roleGroupName: group.roleGroupName,
      yetkiler: groupYetkiler
    } : null
  };
}

// ✅ Yeni kullanıcı
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, organizasyon, personelGrubu, roleGroupId,
      tc, departman, lokasyonlar, lokasyon, bolge, ulke, telefon, mail,
      dogumTarihi, cinsiyet, ehliyet, yetkiler // <- perms/permissions yerine
    } = req.body;

    if (!name || !email || !password || !personelGrubu || !roleGroupId || !organizasyon) {
      return res.status(400).json({ error: "Ad, email, şifre, personelGrubu, roleGroupId ve organizasyon zorunludur." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const finalLokasyonlar = Array.isArray(lokasyonlar)
      ? lokasyonlar
      : (lokasyon ? [lokasyon] : []); // tekil geldiyse diziye çevir

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      organizasyon,
      personelGrubu,
      roleGroupId,

      tc: tc || null,
      departman: departman || null,

      lokasyonlar: finalLokasyonlar,
      lokasyon: lokasyon || null, // legacy alan

      bolge: bolge || null,
      ulke: ulke || null,
      telefon: telefon || null,
      mail: mail || null,
      dogumTarihi: dogumTarihi || null,
      cinsiyet: cinsiyet || null,
      ehliyet: ehliyet ?? false,

      // serbest yetki alanı: ne gönderirsen aynen saklanır
      yetkiler: yetkiler || {}
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: await userResponse(populatedUser)
    });
  } catch (err) {
    console.error("createUser hatası:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });
    }
    return res.status(500).json({
      error: "Kullanıcı oluşturulamadı.",
      details: err.message,
      stack: err.stack,
      mongoError: err.errors || null
    });
  }
};

// ✅ Hepsini getir - OPTIMIZE EDİLDİ
exports.getAllUsers = async (_req, res) => {
  try {
    // ⚡ OPTIMIZE: Populate olmadan çek
    const users = await User.find()
      .sort({ name: 1 })
      .lean();

    if (users.length === 0) return res.json([]);

    // ⚡ OPTIMIZE: RoleGroup'ları batch çek (N+1 problemi çözüldü)
    const RoleGroup = require("../models/roleGroup.model");
    const uniqueRoleGroupIds = [...new Set(users.map(u => u.roleGroupId).filter(Boolean))];
    const roleGroups = await RoleGroup.find({ roleGroupId: { $in: uniqueRoleGroupIds } }).lean();
    const roleGroupMap = new Map(roleGroups.map(g => [g.roleGroupId, g]));

    // ⚡ OPTIMIZE: Referans ID'leri topla
    const departmanIds = [];
    const lokasyonIds = [];
    const bolgeIds = [];
    const ulkeIds = [];

    users.forEach(u => {
      if (u.departman) departmanIds.push(u.departman);
      if (u.bolge) bolgeIds.push(u.bolge);
      if (u.ulke) ulkeIds.push(u.ulke);
      
      // Lokasyonlar array
      if (Array.isArray(u.lokasyonlar)) {
        lokasyonIds.push(...u.lokasyonlar);
      }
      // Legacy tekil lokasyon
      if (u.lokasyon) lokasyonIds.push(u.lokasyon);
    });

    // ⚡ OPTIMIZE: Batch çek (cache'den gelir)
    const [departmanMap, lokasyonMap, bolgeMap, ulkeMap] = await Promise.all([
      // Departman
      (async () => {
        if (departmanIds.length === 0) return new Map();
        const Departman = require("../models/departman.model");
        const docs = await Departman.find({ _id: { $in: [...new Set(departmanIds.map(String))] } })
          .select("ad")
          .lean();
        return new Map(docs.map(d => [String(d._id), d]));
      })(),
      // Lokasyon (cache'den)
      (async () => {
        if (lokasyonIds.length === 0) return new Map();
        const uniqueIds = [...new Set(lokasyonIds.map(String))];
        const docs = await dataLoader.getLokasyonsByIds(uniqueIds);
        const map = new Map();
        docs.forEach((doc, idx) => {
          if (doc) map.set(uniqueIds[idx], doc);
        });
        return map;
      })(),
      // Bölge (cache'den)
      (async () => {
        if (bolgeIds.length === 0) return new Map();
        const uniqueIds = [...new Set(bolgeIds.map(String))];
        const docs = await Promise.all(uniqueIds.map(id => dataLoader.getBolgeById(id)));
        const map = new Map();
        docs.forEach((doc, idx) => {
          if (doc) map.set(uniqueIds[idx], doc);
        });
        return map;
      })(),
      // Ülke (cache'den)
      (async () => {
        if (ulkeIds.length === 0) return new Map();
        const uniqueIds = [...new Set(ulkeIds.map(String))];
        const docs = await Promise.all(uniqueIds.map(id => dataLoader.getUlkeById(id)));
        const map = new Map();
        docs.forEach((doc, idx) => {
          if (doc) map.set(uniqueIds[idx], doc);
        });
        return map;
      })(),
    ]);

    // ⚡ OPTIMIZE: Batch response oluştur (her user için ayrı sorgu yok!)
    const enriched = users.map(user => {
      const group = roleGroupMap.get(user.roleGroupId);
      const groupYetkiler = group ? mapToPlain(group.yetkiler) : {};
      const userYetkiler = mapToPlain(user.yetkiler);

      // Lokasyonlar
      const lokDocs = [];
      if (Array.isArray(user.lokasyonlar)) {
        user.lokasyonlar.forEach(id => {
          const doc = lokasyonMap.get(String(id));
          if (doc) lokDocs.push(doc);
        });
      }
      if (user.lokasyon && !lokDocs.length) {
        const doc = lokasyonMap.get(String(user.lokasyon));
        if (doc) lokDocs.push(doc);
      }

      // Departman
      const departman = user.departman ? departmanMap.get(String(user.departman)) : null;
      const bolge = user.bolge ? bolgeMap.get(String(user.bolge)) : null;
      const ulke = user.ulke ? ulkeMap.get(String(user.ulke)) : null;

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        organizasyon: user.organizasyon || null,
        personelGrubu: user.personelGrubu || null,
        roleGroupId: user.roleGroupId,
        roleGroupName: group?.roleGroupName || null,
        tc: user.tc,
        telefon: user.telefon,
        mail: user.mail,
        dogumTarihi: user.dogumTarihi,
        cinsiyet: user.cinsiyet,
        ehliyet: user.ehliyet,
        departman: departman?._id || null,
        departmanName: departman?.ad || null,
        lokasyonlar: lokDocs.map(l => l._id).filter(Boolean),
        lokasyonlarNames: lokDocs.map(l => l.ad).filter(Boolean),
        bolge: bolge?._id || null,
        bolgeName: bolge?.ad || null,
        ulke: ulke?._id || null,
        ulkeName: ulke?.ad || null,
        yetkiler: userYetkiler,
        roleGroup: group ? {
          roleGroupId: group.roleGroupId,
          roleGroupName: group.roleGroupName,
          yetkiler: groupYetkiler
        } : null
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    res.status(500).json({ error: "Kullanıcılar getirilemedi." });
  }
};

// ✅ Tek kullanıcı - OPTIMIZE EDİLDİ
exports.getUserById = async (req, res) => {
  try {
    // ⚡ OPTIMIZE: Populate olmadan çek
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    // ⚡ OPTIMIZE: Referansları batch çek (cache'den)
    const [roleGroup, departman, lokasyonlar, lokasyon, bolge, ulke] = await Promise.all([
      (async () => {
        if (!user.roleGroupId) return null;
        const RoleGroup = require("../models/roleGroup.model");
        return await RoleGroup.findOne({ roleGroupId: user.roleGroupId }).lean();
      })(),
      user.departman ? (async () => {
        const Departman = require("../models/departman.model");
        return await Departman.findById(user.departman).select("ad").lean();
      })() : null,
      (async () => {
        if (!Array.isArray(user.lokasyonlar) || user.lokasyonlar.length === 0) return [];
        return await dataLoader.getLokasyonsByIds(user.lokasyonlar.map(String));
      })(),
      user.lokasyon ? dataLoader.getLokasyonById(user.lokasyon) : null,
      user.bolge ? dataLoader.getBolgeById(user.bolge) : null,
      user.ulke ? dataLoader.getUlkeById(user.ulke) : null,
    ]);

    // Lokasyonları birleştir
    const lokDocs = lokasyonlar.length > 0 ? lokasyonlar : (lokasyon ? [lokasyon] : []);

    const groupYetkiler = roleGroup ? mapToPlain(roleGroup.yetkiler) : {};
    const userYetkiler = mapToPlain(user.yetkiler);

    const response = {
      id: user._id,
      name: user.name,
      email: user.email,
      organizasyon: user.organizasyon || null,
      personelGrubu: user.personelGrubu || null,
      roleGroupId: user.roleGroupId,
      roleGroupName: roleGroup?.roleGroupName || null,
      tc: user.tc,
      telefon: user.telefon,
      mail: user.mail,
      dogumTarihi: user.dogumTarihi,
      cinsiyet: user.cinsiyet,
      ehliyet: user.ehliyet,
      departman: departman?._id || null,
      departmanName: departman?.ad || null,
      lokasyonlar: lokDocs.map(l => l?._id).filter(Boolean),
      lokasyonlarNames: lokDocs.map(l => l?.ad).filter(Boolean),
      bolge: bolge?._id || null,
      bolgeName: bolge?.ad || null,
      ulke: ulke?._id || null,
      ulkeName: ulke?.ad || null,
      yetkiler: userYetkiler,
      roleGroup: roleGroup ? {
        roleGroupId: roleGroup.roleGroupId,
        roleGroupName: roleGroup.roleGroupName,
        yetkiler: groupYetkiler
      } : null
    };

    res.json(response);
  } catch (err) {
    console.error("getUserById hatası:", err);
    res.status(500).json({ error: "Kullanıcı getirilemedi." });
  }
};

// ✅ Güncelle
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = { ...req.body };

    // gereksiz/gölgeleyen alanları temizle
    delete raw._token;
    delete raw.password;
    delete raw.password_confirmation;

    // tip normalize
    if (raw.hasOwnProperty("ehliyet")) {
      const v = raw.ehliyet;
      raw.ehliyet =
        v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true" || v === "on";
    }
    if (raw.dogumTarihi) {
      const d = new Date(raw.dogumTarihi);
      if (!isNaN(d.getTime())) raw.dogumTarihi = d;
      else delete raw.dogumTarihi;
    }

    // tekil lokasyon -> dizi
    if (!raw.lokasyonlar && raw.lokasyon) {
      raw.lokasyonlar = [raw.lokasyon].filter(Boolean);
    }

    // boş stringleri sil (bilerek null gelirse saklarız)
    for (const [k, v] of Object.entries(raw)) {
      if (v === "") delete raw[k];
    }

    const before = await User.findById(id).lean();
    if (!before) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    // $set
    const result = await User.updateOne({ _id: id }, { $set: raw }, { runValidators: true });

    const after = await User.findById(id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    const diff = {};
    for (const k of Object.keys(raw)) {
      diff[k] = { from: before?.[k] ?? null, to: after?.[k] ?? null };
    }

    return res.json({
      message: "Güncelleme denemesi tamamlandı",
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      setTried: raw,
      diff,
      user: await userResponse(after)
    });
  } catch (err) {
    console.error("updateUser hatası:", err);
    return res.status(500).json({ error: "Güncelleme başarısız.", details: err.message });
  }
};

// ✅ Şoför listesi - OPTIMIZE EDİLDİ
exports.getSoforler = async (_req, res) => {
  try {
    // ⚡ OPTIMIZE: Populate olmadan çek
    const soforler = await User.find({ roleGroupId: "sofor" })
      .select("name telefon musaitlik lokasyonlar lokasyon")
      .lean();

    if (soforler.length === 0) return res.json([]);

    // ⚡ OPTIMIZE: Lokasyon ID'lerini topla
    const lokasyonIds = [];
    soforler.forEach(u => {
      if (Array.isArray(u.lokasyonlar)) lokasyonIds.push(...u.lokasyonlar);
      if (u.lokasyon) lokasyonIds.push(u.lokasyon);
    });

    // ⚡ OPTIMIZE: Batch çek (cache'den)
    const uniqueIds = [...new Set(lokasyonIds.map(String))];
    const lokasyonDocs = await dataLoader.getLokasyonsByIds(uniqueIds);
    const lokasyonMap = new Map();
    lokasyonDocs.forEach((doc, idx) => {
      if (doc) lokasyonMap.set(uniqueIds[idx], doc);
    });

    const out = soforler.map(u => {
      const lokDocs = [];
      if (Array.isArray(u.lokasyonlar)) {
        u.lokasyonlar.forEach(id => {
          const doc = lokasyonMap.get(String(id));
          if (doc) lokDocs.push(doc);
        });
      }
      if (u.lokasyon && !lokDocs.length) {
        const doc = lokasyonMap.get(String(u.lokasyon));
        if (doc) lokDocs.push(doc);
      }

      return {
        _id: u._id,
        name: u.name,
        telefon: u.telefon,
        musaitlik: u.musaitlik,
        lokasyonlar: lokDocs.map(l => l._id).filter(Boolean),
        lokasyonlarNames: lokDocs.map(l => l.ad).filter(Boolean),
      };
    });

    res.json(out);
  } catch (err) {
    console.error("getSoforler hatası:", err);
    res.status(500).json({ error: "Şoför listesi alınamadı." });
  }
};

module.exports = exports;
