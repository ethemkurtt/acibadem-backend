// controllers/auth.controller.js
// Tamamen düzenlenmiş sürüm – güvenli ENV kullanımı, e-posta normalize, küçük sağlamlaştırmalar

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Role = require("../models/role.model");
const { sendMail } = require("../utils/mailer");

// FRONTEND adresini .env'den oku, yoksa sabit değere düş (prod'da .env kullanın)
const FRONTEND_BASE_URL = (
  process.env.FRONTEND_BASE_URL || "https://acibadem.arndevelopment.com.tr"
).replace(/\/+$/, "");

// ───────────────────────────────────────────────────────────────────────────────
// Yardımcılar
// ───────────────────────────────────────────────────────────────────────────────

// string permission birleştirici (role.permissions + user.perms → benzersiz)
function buildEffectivePerms(user, roleDoc) {
  const rolePerms = Array.isArray(roleDoc?.permissions)
    ? roleDoc.permissions
    : [];
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

    departman: user.departman?._id || null,
    departmanName: user.departman?.ad || null,
    lokasyon: user.lokasyon?._id || null,
    lokasyonName: user.lokasyon?.ad || null,
    bolge: user.bolge?._id || null,
    bolgeName: user.bolge?.ad || null,
    ulke: user.ulke?._id || null,
    ulkeName: user.ulke?.ad || null,
  };
}

// Güvenli JWT secret
function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

// ───────────────────────────────────────────────────────────────────────────────
// AUTH: Login
// ───────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre zorunludur." });
    }

    const user = await User.findOne({ email })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) {
      // İsterseniz enumeration önlemek için mesajı birleştirebilirsiniz:
      // return res.status(401).json({ error: "E-posta veya şifre hatalı." });
      return res.status(401).json({ error: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ error: "Şifre hatalı." });

    // numerik ACCESS (mevcut sistem)
    let roleAccess = [];
    if (user.role === "superadmin") {
      roleAccess = Array.from({ length: 100 }, (_, i) => i + 1);
    } else {
      const roleByName = await Role.findOne({ name: user.role });
      roleAccess = roleByName ? roleByName.access || [] : [];
    }
    const finalAccess = [...new Set([...(user.access || []), ...roleAccess])];

    // string PERMISSIONS (yeni RBAC)
    const primaryRoleDoc = await Role.findOne({ name: user.role });
    const finalPerms = buildEffectivePerms(user, primaryRoleDoc);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        access: finalAccess,
        roles: user.roles || [],
        perms: finalPerms,
      },
      getJwtSecret(),
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
    return res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// AUTH: getMe (token’dan)
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

    return res.json({
      user: userResponse(user, decoded.access || [], decoded.perms || []),
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET: forgot (mail gönder)
// POST /api/auth/forgot { email }
// ───────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    if (!email) return res.status(400).json({ error: "E-posta zorunludur." });

    const user = await User.findOne({ email });

    // Enumeration engelle: var/yok fark etmeksizin aynı yanıt
    if (!user) {
      return res.json({
        message: "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
      });
    }

    // Token üret → DB'ye HASH yaz (ham token mailde gidecek)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await user.save();

    const resetUrl = `${FRONTEND_BASE_URL}/sifre-sifirla/verify?token=${rawToken}`;

    const html = `
  <div style="background:#f9fafb;padding:32px 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.08);overflow:hidden">
      
      <!-- Header -->
      <div style="background:#111;color:#fff;padding:20px;text-align:center;font-size:20px;font-weight:bold">
        Acıbadem Portal
      </div>

      <!-- Body -->
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
/*
PASSWORD RESET: token doğrula
GET /api/auth/reset/verify?token=RAW_TOKEN
*/
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

    // İsterseniz formda e-posta göstermek için dönüyoruz
    return res.json({ valid: true, email: user.email });
  } catch (err) {
    console.error("verifyResetToken error:", err);
    return res.status(500).json({ valid: false, error: "Sunucu hatası" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
/*
PASSWORD RESET: yeni şifre belirle
POST /api/auth/reset { token, password }
*/
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
