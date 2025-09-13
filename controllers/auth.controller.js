// controllers/auth.controller.js
// Tam sürüm – RoleGroup & Role yetki birleştirme, güvenli ENV, e-posta normalize,
// JWT payload'a lokasyon eklendi, tutarlı login/getMe hesaplaması, sağlamlaştırmalar.

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Role = require("../models/role.model");
const RoleGroup = require("../models/roleGroup.model");
const { sendMail } = require("../utils/mailer");

// FRONTEND adresi (.env'den), sonda / temizlenir
const FRONTEND_BASE_URL = (
  process.env.FRONTEND_BASE_URL || "https://acibadem.arndevelopment.com.tr"
).replace(/\/+$/, "");

// ───────────────────────────────────────────────────────────────────────────────
// Yardımcılar
// ───────────────────────────────────────────────────────────────────────────────
function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

function mapLikeToPlainObject(input) {
  if (!input) return {};
  if (input instanceof Map) return Object.fromEntries(input);
  if (typeof input === "object") return { ...input };
  return {};
}

function stripDollarKeys(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!k.startsWith("$")) out[k] = v;
  }
  return out;
}

function mergePagePermissions(groupObj, userObj) {
  const base = stripDollarKeys(mapLikeToPlainObject(groupObj));
  const user = stripDollarKeys(mapLikeToPlainObject(userObj));
  return { ...base, ...user }; // user aynı sayfayı yazdıysa override
}

function mergeStringPerms(...lists) {
  const flat = lists
    .filter(Array.isArray)
    .flat()
    .filter((x) => typeof x === "string");
  return Array.from(new Set(flat));
}

function mergeNumericAccess(...lists) {
  const flat = lists
    .filter(Array.isArray)
    .flat()
    .filter((x) => Number.isFinite(x));
  return Array.from(new Set(flat));
}

async function findRoleGroupForUser(user) {
  if (!user?.roleGroupId) return null;

  const q = {
    $or: [
      { _id: user.roleGroupId },
      { roleId: user.roleGroupId },
      { roleName: user.roleGroupId },
    ],
  };
  try {
    const doc = await RoleGroup.findOne(q);
    return doc || null;
  } catch {
    try {
      const doc = await RoleGroup.findOne({
        $or: [{ roleId: String(user.roleGroupId) }, { roleName: String(user.roleGroupId) }],
      });
      return doc || null;
    } catch {
      return null;
    }
  }
}

async function findPrimaryRoleDoc(user) {
  if (!user?.role) return null;
  try {
    const doc = await Role.findOne({ name: user.role });
    return doc || null;
  } catch {
    return null;
  }
}

async function computeAccess(user, roleDoc) {
  let roleAccess = [];
  if (user.role === "superadmin") {
    roleAccess = Array.from({ length: 100 }, (_, i) => i + 1);
  } else {
    roleAccess = Array.isArray(roleDoc?.access) ? roleDoc.access : [];
  }
  return mergeNumericAccess(user.access || [], roleAccess);
}

async function computeAllPermissions(user) {
  const roleDoc = await findPrimaryRoleDoc(user);
  const groupDoc = await findRoleGroupForUser(user);

  // String perms
  const rolePerms = Array.isArray(roleDoc?.permissions) ? roleDoc.permissions : [];
  const groupPerms = Array.isArray(groupDoc?.yetkiler?.perms) ? groupDoc.yetkiler.perms : [];
  const userPerms = Array.isArray(user?.perms) ? user.perms : [];
  const finalPerms = mergeStringPerms(rolePerms, groupPerms, userPerms);

  // Sayfa bazlı permissions (obj)
  const groupPermsObj = mapLikeToPlainObject(groupDoc?.yetkiler?.permissions);
  const userPermsObj = mapLikeToPlainObject(user?.permissions);
  const mergedPermissions = mergePagePermissions(groupPermsObj, userPermsObj);

  return { finalPerms, mergedPermissions, roleDoc };
}

// FE’ye dönecek kullanıcı formatı
function userResponse(user, access, perms, mergedPermissions) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,

    // backward-compat
    role: user.role,
    access,

    // yeni RBAC alanları
    roles: user.roles || [],
    perms: perms || [],
    permissions: mergedPermissions || {},

    // profil alanları
    tc: user.tc,
    telefon: user.telefon,
    mail: user.mail,
    dogumTarihi: user.dogumTarihi,
    cinsiyet: user.cinsiyet,
    ehliyet: user.ehliyet,

    // referanslar
    departman: user.departman?._id || null,
    departmanName: user.departman?.ad || null,
    lokasyon: user.lokasyon?._id || null,     // FE için lokasyon id
    lokasyonName: user.lokasyon?.ad || null,  // FE için lokasyon adı
    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// AUTH: Login
// ───────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select("+password")
      .populate("departman", "ad")
      .populate("lokasyonlar", "ad")
      .populate("lokasyon", "ad"); // 🔑 legacy populate

    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Hatalı şifre." });

    const lokDocs = (user.lokasyonlar && user.lokasyonlar.length) ? user.lokasyonlar : (user.lokasyon ? [user.lokasyon] : []);

    const token = jwt.sign({ id: user._id, email: user.email, roleGroupId: user.roleGroupId }, process.env.JWT_SECRET, { expiresIn: "12h" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        departman: user.departman?._id || null,
        departmanName: user.departman?.ad || null,
        lokasyonlar: lokDocs.map(l => l?._id ?? l).filter(Boolean),
        lokasyonlarNames: lokDocs.map(l => l?.ad).filter(Boolean),
      }
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token bulunamadı." });

    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    // Tutarlılık için yetkileri DB'den yeniden hesapla
    const { finalPerms, mergedPermissions, roleDoc } = await computeAllPermissions(user);
    const finalAccess = await computeAccess(user, roleDoc);

    return res.json({
      user: userResponse(user, finalAccess, finalPerms, mergedPermissions),
      role: user.role,
      access: finalAccess,
      perms: finalPerms,
      roles: user.roles || [],
      permissions: mergedPermissions,
    });
  } catch (err) {
    console.error("getMe error:", err);
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Oturum süresi doldu." });
    }
    if (err?.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Geçersiz token." });
    }
    return res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: forgot (mail gönder)
// ───────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "E-posta zorunludur." });

    const user = await User.findOne({ email });

    // Enumeration engelle: var/yok fark etmeksizin aynı yanıt
    if (!user) {
      return res.json({
        message: "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await user.save();

    const resetUrl = `${FRONTEND_BASE_URL}/sifre-sifirla/verify?token=${rawToken}`;

    const html = `
  <div style="background:#f9fafb;padding:32px 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.08);overflow:hidden">
      <div style="background:#111;color:#fff;padding:20px;text-align:center;font-size:20px;font-weight:bold">
        Acıbadem Portal
      </div>
      <div style="padding:32px;color:#111;font-size:15px;line-height:1.6">
        <h2 style="margin-top:0;margin-bottom:12px;font-size:22px">Şifre Sıfırlama</h2>
        <p>Merhaba,</p>
        <p>Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın. Bu bağlantı 
          <b style="color:#d6336c">1 saat</b> boyunca geçerlidir.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 20px;background:#111;color:#fff;
                    text-decoration:none;border-radius:6px;font-weight:500;font-size:15px">
            🔑 Şifreyi Sıfırla
          </a>
        </div>
        <p style="font-size:13px;color:#555">Eğer buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</p>
        <p style="word-break:break-all;font-size:13px;color:#444">${resetUrl}</p>
        <hr style="margin:28px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#777;text-align:center">
          Bu e-posta otomatik gönderildi. Siz talep etmediyseniz görmezden gelebilirsiniz.
        </p>
      </div>
    </div>
  </div>
`;

    await sendMail({
      to: user.email,
      subject: "Şifre Sıfırlama – Acıbadem",
      text: `Şifrenizi sıfırlamak için bu bağlantıya tıklayın: ${resetUrl}`,
      html,
    });

    return res.json({
      message: "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ error: "İşlem yapılamadı." });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: token doğrula
// ───────────────────────────────────────────────────────────────────────────────
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ valid: false, error: "Token gerekli." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.json({ valid: false });

    return res.json({ valid: true, email: user.email });
  } catch (err) {
    console.error("verifyResetToken error:", err);
    return res.status(500).json({ valid: false, error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: yeni şifre belirle
// ───────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");

    if (!token || !password) {
      return res.status(400).json({ error: "Token ve yeni şifre zorunludur." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Şifre en az 8 karakter olmalı." });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      return res
        .status(400)
        .json({ error: "Token geçersiz veya süresi dolmuş." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      message: "Şifre başarıyla güncellendi. Giriş yapabilirsiniz.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ error: "İşlem yapılamadı." });
  }
};
