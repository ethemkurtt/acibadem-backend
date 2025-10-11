// controllers/user.controller.js
// ... üst require'lar aynı
const User = require("../models/user.model");

// helper: Map/Mixed -> plain object
function mapToPlain(objOrMap) {
  if (!objOrMap) return {};
  if (objOrMap instanceof Map) return Object.fromEntries(objOrMap);
  if (typeof objOrMap === "object" && !Array.isArray(objOrMap)) return { ...objOrMap };
  return {};
}

// helper: response builder (roleGroup + yetkiler dahil)
async function userResponse(user) {
  const RoleGroup = require("../models/roleGroup.model");

  // RoleGroup'u roleGroupId (string) ile bul
  const group = await RoleGroup.findOne({ roleGroupId: user.roleGroupId }).lean();

  // RoleGroup.yetkiler'i düz objeye çevir
  const groupYetkiler = group ? mapToPlain(group.yetkiler) : {};

  // Kullanıcı yetkilerini düz objeye çevir
  const userYetkiler = mapToPlain(user.yetkiler);

  // 🔑 Fallback: lokasyonlar boşsa tekil lokasyonu diziye çevir
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

    tc: user.tc,
    telefon: user.telefon,
    mail: user.mail,
    dogumTarihi: user.dogumTarihi,
    cinsiyet: user.cinsiyet,
    ehliyet: user.ehliyet,

    departman: user.departman?._id || null,
    departmanName: user.departman?.ad || null,

    lokasyonlar: lokDocs.map(l => l?._id ?? l).filter(Boolean),
    lokasyonlarNames: lokDocs.map(l => l?.ad).filter(Boolean),

    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,

    // 🔵 YENİ: Kullanıcının kendi yetkileri (Map -> plain)
    yetkiler: userYetkiler,

    // 🔵 YENİ: RoleGroup bilgisi (roleGroupId ile) + grubun yetkileri
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
      : (lokasyon ? [lokasyon] : []); // 🔑 tekil geldi ise diziye çevir

    const newUser = new User({
      name, email, password: hashedPassword, organizasyon, personelGrubu, roleGroupId,
      tc: tc || null, departman: departman || null,
      lokasyonlar: finalLokasyonlar,
      lokasyon: lokasyon || null, // legacy alanı da set edelim istenirse
      bolge: bolge || null, ulke: ulke || null, telefon: telefon || null, mail: mail || null,
      dogumTarihi: dogumTarihi || null, cinsiyet: cinsiyet || null, ehliyet: ehliyet ?? false,
      yetkiler: yetkiler || {} // <- kullanıcının kendi yetkileri
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    res.status(201).json({ message: "Kullanıcı oluşturuldu.", user: await userResponse(populatedUser) });
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

// ✅ Hepsini getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ name: 1 })
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    const enrichedUsers = await Promise.all(users.map(user => userResponse(user)));
    res.json(enrichedUsers);
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    res.status(500).json({ error: "Kullanıcılar getirilemedi." });
  }
};

// ✅ Tek kullanıcı
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    res.json(await userResponse(user));
  } catch (err) {
    console.error("getUserById hatası:", err);
    res.status(500).json({ error: "Kullanıcı getirilemedi." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Giriş verisi
    const raw = { ...req.body };

    // 2) Gereksiz/gölgeleyen alanları temizle
    delete raw._token;
    delete raw.password;
    delete raw.password_confirmation;

    // 3) Normalize (tip dönüşümleri)
    if (raw.hasOwnProperty('ehliyet')) {
      const v = raw.ehliyet;
      raw.ehliyet = v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true' || v === 'on';
    }
    if (raw.dogumTarihi) {
      const d = new Date(raw.dogumTarihi);
      if (!isNaN(d.getTime())) raw.dogumTarihi = d;
      else delete raw.dogumTarihi; // tarih parse edilemiyorsa update etme
    }

    // Tekil lokasyonu diziye yansıt (opsiyonel)
    if (!raw.lokasyonlar && raw.lokasyon) {
      raw.lokasyonlar = [raw.lokasyon].filter(Boolean);
    }

    // 4) Boş stringleri sil (bilerek null gönderilirse saklanır)
    for (const [k, v] of Object.entries(raw)) {
      if (v === '') delete raw[k];
    }

    // 5) Update öncesi dokümanı çek
    const before = await User.findById(id).lean();
    if (!before) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // 6) $set ile güncelle
    const result = await User.updateOne({ _id: id }, { $set: raw }, { runValidators: true });

    // 7) Update sonrası dokümanı çek
    const after = await User.findById(id)
      .populate('departman', 'ad')
      .populate('lokasyonlar', 'ad')
      .populate('lokasyon', 'ad')
      .populate('bolge', 'ad')
      .populate('ulke', 'ad');

    // 8) Diff (sadece gönderdiğin anahtarlar üzerinden)
    const diff = {};
    for (const k of Object.keys(raw)) {
      diff[k] = { from: before?.[k] ?? null, to: after?.[k] ?? null };
    }

    return res.json({
      message: 'Güncelleme denemesi tamamlandı',
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      setTried: raw,
      diff,
      user: await userResponse(after)
    });
  } catch (err) {
    console.error('updateUser hatası:', err);
    return res.status(500).json({
      error: 'Güncelleme başarısız.',
      details: err.message
    });
  }
};

// ✅ Şoför listesi
exports.getSoforler = async (req, res) => {
  try {
    const soforler = await User.find({ roleGroupId: "sofor" })
      .select("name telefon musaitlik lokasyonlar lokasyon")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad");

    // legacy fallback'lı düz çıktı
    const out = soforler.map(u => {
      const lokDocs = (u.lokasyonlar && u.lokasyonlar.length) ? u.lokasyonlar : (u.lokasyon ? [u.lokasyon] : []);
      return {
        _id: u._id,
        name: u.name,
        telefon: u.telefon,
        musaitlik: u.musaitlik,
        lokasyonlar: lokDocs.map(l => l?._id ?? l).filter(Boolean),
        lokasyonlarNames: lokDocs.map(l => l?.ad).filter(Boolean),
      };
    });

    res.json(out);
  } catch (err) {
    res.status(500).json({ error: "Şoför listesi alınamadı." });
  }
};

module.exports = exports;
