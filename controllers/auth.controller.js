// controllers/auth.controller.js
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

const User = require("../models/user.model");
const Role = require("../models/role.model");
const { sendMail } = require("../utils/mailer");

// Kullanıcının tıklayacağı FRONTEND adresi (ENV KULLANMADAN SABİT)
const FRONTEND_BASE_URL = "https://acibadem.arndevelopment.com.tr"; // örn: https://panel.senin-domainin.com

// ───────────────────────────────────────────────────────────────────────────────
// Yardımcılar
// ───────────────────────────────────────────────────────────────────────────────

// string permission birleştirici (role.permissions + user.perms → benzersiz)
function buildEffectivePerms(user, roleDoc) {
  const rolePerms = Array.isArray(roleDoc?.permissions) ? roleDoc.permissions : [];
  const userPerms = Array.isArray(user.perms) ? user.perms : [];
  return Array.from(new Set([...rolePerms, ...userPerms]));
}

// Response formatter (mevcut alanlar + perms/roles)
function userResponse(user, access, perms) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,

    // backward-compat
    role: user.role,
    access: access,

    // yeni RBAC alanları
    roles: user.roles || [],
    perms: perms || [],

    tc: user.tc,
    telefon: user.telefon,
    mail: user.mail,
    dogumTarihi: user.dogumTarihi,
    cinsiyet: user.cinsiyet,
    ehliyet: user.ehliyet,

    departman:     user.departman?._id || null,
    departmanName: user.departman?.ad || null,
    lokasyon:      user.lokasyon?._id || null,
    lokasyonName:  user.lokasyon?.ad || null,
    bolge:         user.bolge?._id || null,
    bolgeName:     user.bolge?.ad || null,
    ulke:          user.ulke?._id || null,
    ulkeName:      user.ulke?.ad || null,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// AUTH: Login
// ───────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ error: "Şifre hatalı." });

    // numerik ACCESS (mevcut sistem)
    let roleAccess = [];
    if (user.role === "superadmin") {
      roleAccess = Array.from({ length: 100 }, (_, i) => i + 1);
    } else {
      const roleByName = await Role.findOne({ name: user.role });
      roleAccess = roleByName ? (roleByName.access || []) : [];
    }
    const finalAccess = [...new Set([...(user.access || []), ...roleAccess])];

    // string PERMISSIONS (yeni RBAC)
    const primaryRoleDoc = await Role.findOne({ name: user.role });
    const finalPerms = buildEffectivePerms(user, primaryRoleDoc);

    const token = jwt.sign(
      {
        id:   user._id,
        role: user.role,
        access: finalAccess,
        roles: user.roles || [],
        perms: finalPerms
      },
      process.env.JWT_SECRET || "dev-secret", // gerekirse sabit
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Giriş başarılı.",
      token,
      role: user.role,
      access: finalAccess,
      perms: finalPerms,
      roles: user.roles || [],
      user: userResponse(user, finalAccess, finalPerms),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// AUTH: getMe (token’dan)
// ───────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token bulunamadı." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({ user: userResponse(user, decoded.access || [], decoded.perms || []) });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: forgot (mail gönder)
// POST /api/auth/forgot { email }
// ───────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "E-posta zorunludur." });

    const user = await User.findOne({ email });

    // Enumeration engelle: var/yok fark etmeksizin aynı yanıt
    if (!user) {
      return res.json({ message: "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi." });
    }

    // Token üret → DB'ye HASH yaz (ham token mailde gidecek)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed   = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken   = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await user.save();

    const base = FRONTEND_BASE_URL.replace(/\/+$/, "");
    const resetUrl = `${base}/sifre-sifirla/verify?token=${rawToken}`;

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
        <h2>Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bu bağlantı <b>1 saat</b> geçerlidir.</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
        <hr/>
        <p>Eğer bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `;

    await sendMail({
      to: user.email,
      subject: "Şifre Sıfırlama – Acıbadem",
      text: `Şifrenizi sıfırlamak için bu bağlantıya tıklayın: ${resetUrl}`,
      html,
    });

    return res.json({ message: "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ error: "İşlem yapılamadı." });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: token doğrula
// GET /api/auth/reset/verify?token=RAW_TOKEN
// ───────────────────────────────────────────────────────────────────────────────
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false, error: "Token gerekli." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.json({ valid: false });

    // İstersen e-posta gönderelim (formda göstermek için)
    return res.json({ valid: true, email: user.email });
  } catch (err) {
    console.error("verifyResetToken error:", err);
    return res.status(500).json({ valid: false, error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: yeni şifre belirle
// POST /api/auth/reset { token, password }
// ───────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token ve yeni şifre zorunludur." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Şifre en az 8 karakter olmalı." });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: "Token geçersiz veya süresi dolmuş." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Şifre başarıyla güncellendi. Giriş yapabilirsiniz." });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ error: "İşlem yapılamadı." });
  }
};
