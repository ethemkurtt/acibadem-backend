// middlewares/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// ObjectId / Doc / String -> her durumda string ObjectId
function asId(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val._id) return String(val._id);
  if (val.toString && val.constructor && val.constructor.name === "ObjectId") {
    return val.toString();
  }
  return null;
}

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    // prod'da .env zorunlu; istersen fallback ver:
    // return "dev-secret";
    throw new Error("JWT_SECRET missing");
  }
  return s;
}

exports.authRequired = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || "";
    const bearer = raw.replace(/^Bearer\s+/i, "").trim();
    const token = bearer || req.cookies?.token || ""; // opsiyonel cookie desteği

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let claims;
    try {
      claims = jwt.verify(token, getJwtSecret());
    } catch (e) {
      if (e?.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = claims.sub || claims.id || claims._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Hafif select: FE’de lazım olacak alanlar
    const user = await User.findById(userId)
      .select("name email role roleGroupId permissions perms departman lokasyon bolge ulke")
      .populate("departman", "ad")
      .populate("lokasyon", "ad") // hem id hem ad lazım
      .populate("bolge", "ad")
      .populate("ulke", "ad")
      .lean();

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Map -> plain
    const permissions =
      user.permissions instanceof Map
        ? Object.fromEntries(user.permissions)
        : user.permissions || {};

    // Normalize alanlar
    const lokasyonId = asId(user.lokasyon);
    const lokasyonName = typeof user.lokasyon === "object" && user.lokasyon ? user.lokasyon.ad : null;

    // Controller’lar için net ve hafif context
    req.userId = String(user._id);
    req.lokasyonId = lokasyonId;

    req.auth = {
      id: req.userId,
      role: user.role || null,
      roleGroupId: user.roleGroupId || null,
      lokasyonId,
      lokasyonName,
    };

    // FE’ye/route’lara yeterli güvenli kullanıcı objesi
    req.user = {
      _id: req.userId,
      name: user.name,
      email: user.email,
      role: user.role || null,
      roleGroupId: user.roleGroupId || null,
      perms: Array.isArray(user.perms) ? user.perms : [],
      permissions,
      departman: user.departman?._id || null,
      departmanName: user.departman?.ad || null,
      lokasyon: lokasyonId,          // id
      lokasyonName,                  // ad
      bolge: user.bolge?._id || null,
      bolgeName: user.bolge?.ad || null,
      ulke: user.ulke?._id || null,
      ulkeName: user.ulke?.ad || null,
    };

    return next();
  } catch (e) {
    // JWT_SECRET yoksa vs.
    return res.status(401).json({ error: "Unauthorized" });
  }
};
