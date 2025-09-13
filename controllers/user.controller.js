const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const RoleGroup = require("../models/roleGroup.model");

// ✅ Yeni kullanıcı oluştur
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organizasyon,
      personelGrubu,
      roleGroupId,
      tc,
      departman,
      lokasyonlar,
      bolge,
      ulke,
      telefon,
      mail,
      dogumTarihi,
      cinsiyet,
      ehliyet,
      permissions,
      perms
    } = req.body;

    if (!name || !email || !password || !personelGrubu || !roleGroupId || !organizasyon) {
      return res.status(400).json({
        error: "Ad, email, şifre, personelGrubu, roleGroupId ve organizasyon zorunludur."
      });
    }

    if (perms && !Array.isArray(perms)) {
      return res.status(400).json({ error: "perms bir dizi (string[]) olmalı." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      organizasyon,
      personelGrubu,
      roleGroupId,
      tc: tc || null,
      departman: departman || null,
      lokasyonlar: Array.isArray(lokasyonlar) ? lokasyonlar : [],
      bolge: bolge || null,
      ulke: ulke || null,
      telefon: telefon || null,
      mail: mail || null,
      dogumTarihi: dogumTarihi || null,
      cinsiyet: cinsiyet || null,
      ehliyet: ehliyet ?? false,
      permissions: permissions || {},
      perms: perms || []
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: await userResponse(populatedUser)
    });
  } catch (err) {
    console.error("createUser hatası:", err);
    res.status(500).json({ error: "Kullanıcı oluşturulamadı." });
  }
};

// ✅ Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ name: 1 })
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    const enrichedUsers = await Promise.all(users.map(user => userResponse(user)));
    res.json(enrichedUsers);
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    res.status(500).json({ error: "Kullanıcılar getirilemedi." });
  }
};

// ✅ Tek kullanıcıyı getir
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    res.json(await userResponse(user));
  } catch (err) {
    console.error("getUserById hatası:", err);
    res.status(500).json({ error: "Kullanıcı getirilemedi." });
  }
};

// ✅ Kullanıcı güncelle
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.perms && !Array.isArray(updateData.perms)) {
      return res.status(400).json({ error: "perms bir dizi (string[]) olmalı." });
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    if (updateData.lokasyonlar && !Array.isArray(updateData.lokasyonlar)) {
      return res.status(400).json({ error: "lokasyonlar bir dizi olmalı." });
    }

    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!updated) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({
      message: "Kullanıcı güncellendi.",
      user: await userResponse(updated)
    });
  } catch (err) {
    console.error("updateUser hatası:", err);
    res.status(500).json({ error: "Güncelleme başarısız." });
  }
};

// ✅ Kullanıcı sil
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    res.json({ message: "Kullanıcı silindi.", id: deleted._id });
  } catch (err) {
    console.error("deleteUser hatası:", err);
    res.status(500).json({ error: "Silme işlemi başarısız." });
  }
};

// ✅ Kullanıcı + RoleGroup yetkilerini birleştir
async function userResponse(user) {
  const group = await RoleGroup.findOne({ roleId: user.roleGroupId });

  let groupPermissions = {};
  const groupPerms = Array.isArray(group?.yetkiler?.perms) ? group.yetkiler.perms : [];

  if (group?.yetkiler?.permissions instanceof Map) {
    groupPermissions = Object.fromEntries(group.yetkiler.permissions);
  } else if (typeof group?.yetkiler?.permissions === "object" && group.yetkiler.permissions !== null) {
    for (const [key, val] of Object.entries(group.yetkiler.permissions)) {
      if (!key.startsWith("$")) groupPermissions[key] = val;
    }
  }

  const userPerms = Array.isArray(user.perms) ? user.perms : [];

  let userPermissions = {};
  if (user.permissions instanceof Map) {
    userPermissions = Object.fromEntries(user.permissions);
  } else if (typeof user.permissions === "object" && user.permissions !== null) {
    for (const [key, val] of Object.entries(user.permissions)) {
      if (!key.startsWith("$")) userPermissions[key] = val;
    }
  }

  const mergedPerms = Array.from(new Set([...groupPerms, ...userPerms]));

  const mergedPermissions = { ...groupPermissions };
  for (const [page, actions] of Object.entries(userPermissions)) {
    mergedPermissions[page] = actions;
  }

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
    lokasyonlar: user.lokasyonlar?.map(l => l._id) || [],
    lokasyonlarNames: user.lokasyonlar?.map(l => l.ad) || [],
    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,

    perms: mergedPerms,
    permissions: mergedPermissions
  };
}

// ✅ Şoförleri getir
exports.getSoforler = async (req, res) => {
  try {
    const soforler = await User.find({ roleGroupId: "sofor" })
      .select("name telefon musaitlik lokasyonlar")
      .populate("lokasyonlar", "ad");

    res.json(soforler);
  } catch (err) {
    res.status(500).json({ error: "Şoför listesi alınamadı." });
  }
};
