const User = require("../models/user.model");
const Role = require("../models/role.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Şifre hatalı." });

    let roleAccess = [];

    if (user.role === "superadmin") {
      roleAccess = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100 arası
    } else {
      const role = await Role.findOne({ name: user.role });
      roleAccess = role ? role.access : [];
    }

    const finalAccess = [...new Set([...(user.access || []), ...roleAccess])];

    const token = jwt.sign(
      { id: user._id, role: user.role, access: finalAccess },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Giriş başarılı.",
      token,
      role: user.role,
      access: finalAccess,
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

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        access: decoded.access,
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
      },
    });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
