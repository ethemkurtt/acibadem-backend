// controllers/auth.controller.js
const User  = require("../models/user.model");
const Role  = require("../models/role.model");
const bcrypt= require("bcryptjs");
const jwt   = require("jsonwebtoken");

// 🔹 yardımcı: string permission birleştirici
function buildEffectivePerms(user, roleDoc) {
  const rolePerms = Array.isArray(roleDoc?.permissions) ? roleDoc.permissions : [];
  const userPerms = Array.isArray(user.perms) ? user.perms : [];
  // benzersizleştir
  return Array.from(new Set([...rolePerms, ...userPerms]));
}

// ✨ kullanıcıyı response formatında döndürmek için fonksiyon (senin versiyonun + perms/roles eklendi)
function userResponse(user, access, perms) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,

    // backward-compat alanlar
    role: user.role,
    access: access,

    // 🔹 yeni RBAC alanları
    roles: user.roles || [],   // çoklu rol
    perms: perms || [],        // efektif string izinler

    tc: user.tc,
    telefon: user.telefon,
    mail: user.mail,
    dogumTarihi: user.dogumTarihi,
    cinsiyet: user.cinsiyet,
    ehliyet: user.ehliyet,

    departman:      user.departman?._id || null,
    departmanName:  user.departman?.ad || null,
    lokasyon:       user.lokasyon?._id || null,
    lokasyonName:   user.lokasyon?.ad || null,
    bolge:          user.bolge?._id || null,
    bolgeName:      user.bolge?.ad || null,
    ulke:           user.ulke?._id || null,
    ulkeName:       user.ulke?.ad || null,
  };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Şifre hatalı." });

    // ---- numerik ACCESS (mevcut sistemin devamı) ----
    let roleAccess = [];
    if (user.role === "superadmin") {
      roleAccess = Array.from({ length: 100 }, (_, i) => i + 1);
    } else {
      const roleByName = await Role.findOne({ name: user.role });
      roleAccess = roleByName ? (roleByName.access || []) : [];
    }
    const finalAccess = [...new Set([...(user.access || []), ...roleAccess])];

    // ---- string PERMISSIONS (yeni RBAC) ----
    // Çoklu rol desteği için, istersen Role koleksiyonunu name ∈ user.roles ile de çekip birleştirebilirsin.
    const primaryRoleDoc = await Role.findOne({ name: user.role });
    const finalPerms = buildEffectivePerms(user, primaryRoleDoc); // role.permissions + user.perms

    const token = jwt.sign(
      {
        id:   user._id,
        role: user.role,        // eski kullanım
        access: finalAccess,    // eski kullanım
        // 🔹 yeni
        roles: user.roles || [],
        perms: finalPerms
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Giriş başarılı.",
      token,
      role: user.role,
      access: finalAccess,
      // 🔹 yeni alanlar da dönüyor
      perms: finalPerms,
      roles: user.roles || [],
      user: userResponse(user, finalAccess, finalPerms),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token bulunamadı." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    // decoded.access ve decoded.perms’tan faydalanıyoruz
    res.json({ user: userResponse(user, decoded.access || [], decoded.perms || []) });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
