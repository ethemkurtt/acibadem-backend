// middlewares/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.authRequired = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub || payload.id || payload._id;

    const user = await User.findById(userId)
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Map -> plain object (UI kolaylığı)
    const perms =
      user.permissions instanceof Map
        ? Object.fromEntries(user.permissions)
        : user.permissions || {};

    req.user = user.toObject();
    req.user.permissions = perms;

    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
