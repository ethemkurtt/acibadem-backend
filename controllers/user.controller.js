// ... üst require'lar aynı
const User = require("../models/user.model");
// helper: response builder (fallback dahil)
async function userResponse(user) {
  const RoleGroup = require("../models/roleGroup.model");
  const group = await RoleGroup.findOne({ roleId: user.roleGroupId });

  const groupPerms = Array.isArray(group?.yetkiler?.perms) ? group.yetkiler.perms : [];
  let groupPermissions = {};
  if (group?.yetkiler?.permissions instanceof Map) {
    groupPermissions = Object.fromEntries(group.yetkiler.permissions);
  } else if (group?.yetkiler?.permissions && typeof group.yetkiler.permissions === "object") {
    for (const [k, v] of Object.entries(group.yetkiler.permissions)) {
      if (!k.startsWith("$")) groupPermissions[k] = v;
    }
  }

  const userPerms = Array.isArray(user.perms) ? user.perms : [];
  let userPermissions = {};
  if (user.permissions instanceof Map) userPermissions = Object.fromEntries(user.permissions);
  else if (user.permissions && typeof user.permissions === "object") {
    for (const [k, v] of Object.entries(user.permissions)) {
      if (!k.startsWith("$")) userPermissions[k] = v;
    }
  }

  const mergedPerms = Array.from(new Set([...groupPerms, ...userPerms]));
  const mergedPermissions = { ...groupPermissions, ...userPermissions };

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
    roleGroupName: group?.roleName || null,

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

    perms: mergedPerms,
    permissions: mergedPermissions
  };
}

// ✅ Yeni kullanıcı
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, organizasyon, personelGrubu, roleGroupId,
      tc, departman, lokasyonlar, lokasyon, bolge, ulke, telefon, mail,
      dogumTarihi, cinsiyet, ehliyet, permissions, perms
    } = req.body;

    if (!name || !email || !password || !personelGrubu || !roleGroupId || !organizasyon) {
      return res.status(400).json({ error: "Ad, email, şifre, personelGrubu, roleGroupId ve organizasyon zorunludur." });
    }

    if (perms && !Array.isArray(perms)) return res.status(400).json({ error: "perms bir dizi (string[]) olmalı." });

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
      permissions: permissions || {}, perms: perms || []
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

  // Eğer Mongo duplicate key hatasıysa
  if (err.code === 11000) {
    return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });
  }

  // Geri kalan tüm hataları olduğu gibi JSON’a bas
  return res.status(500).json({
    error: "Kullanıcı oluşturulamadı.",
    details: err.message,       // hata mesajı
    stack: err.stack,           // stack trace
    mongoError: err.errors || null // mongoose validation hataları varsa
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

// ✅ Güncelle
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    console.log(updateData);
    if (updateData.perms && !Array.isArray(updateData.perms)) {
      return res.status(400).json({ error: "perms bir dizi (string[]) olmalı." });
    }

    if (updateData.password) {
      const bcrypt = require("bcryptjs");
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    if (updateData.lokasyonlar && !Array.isArray(updateData.lokasyonlar)) {
      return res.status(400).json({ error: "lokasyonlar bir dizi olmalı." });
    }

    // tekil lokasyon geldiyse diziye yansıt
    if (!updateData.lokasyonlar && updateData.lokasyon) {
      updateData.lokasyonlar = [updateData.lokasyon];
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!updated) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({ message: "Kullanıcı güncellendi.", user: await userResponse(updated) });
  } catch (err) {
    console.error("updateUser hatası:", err);
    res.status(500).json({ error: "Güncelleme başarısız." });
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
