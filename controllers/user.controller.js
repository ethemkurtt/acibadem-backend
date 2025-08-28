const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const RoleGroup = require("../models/roleGroup.model");

// Yeni kullanıcı oluştur
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
      lokasyon,
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
      lokasyon: lokasyon || null,
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
      .populate("lokasyon", "ad")
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

// Tüm kullanıcılar
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ name: 1 })
      .populate("departman", "ad")
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

// Tek kullanıcı
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("departman", "ad")
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

// Güncelle
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

    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
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

// Sil
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

// Yardımcı: Yetkileri birleştir ve kullanıcı cevabını hazırla
async function userResponse(user) {
  const group = await RoleGroup.findOne({ roleId: user.roleGroupId });

  const groupPerms = Array.isArray(group?.yetkiler?.perms) ? group.yetkiler.perms : [];
  const groupPermissions = group?.yetkiler?.permissions || {};

  const userPerms = Array.isArray(user.perms) ? user.perms : [];
  const userPermissions = user.permissions instanceof Map
    ? Object.fromEntries(user.permissions)
    : user.permissions || {};

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
    lokasyon: user.lokasyon?._id || null,
    lokasyonName: user.lokasyon?.ad || null,
    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,

    perms: mergedPerms,
    permissions: mergedPermissions
  };
}
