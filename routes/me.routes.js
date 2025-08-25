// routes/me.routes.js
const express = require("express");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    access: u.access,
    roles: u.roles || [],
    perms: u.perms || [],
    permissions: u.permissions || {},

    departman: u.departman?._id || null,
    departmanName: u.departman?.ad || null,
    lokasyon: u.lokasyon?._id || null,
    lokasyonName: u.lokasyon?.ad || null,
    bolge: u.bolge?._id || null,
    bolgeName: u.bolge?.ad || null,
    ulke: u.ulke?._id || null,
    ulkeName: u.ulke?.ad || null
  });
});

module.exports = router;
