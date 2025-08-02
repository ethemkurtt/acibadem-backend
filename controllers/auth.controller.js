const User = require("../models/user.model");
const Role = require("../models/role.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Kullanıcıyı getir
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

    // 🔒 Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Şifre hatalı." });

    let roleAccess = [];

    // ✅ Superadmin ise tüm erişim izinlerini ver
    if (user.role === "superadmin") {
      // Varsayılan olarak tüm izinleri veriyoruz – örnek: 1-100 arası
      roleAccess = Array.from({ length: 100 }, (_, i) => i + 1);
    } else {
      // 🔽 Diğer roller için Role koleksiyonundan erişim al
      const role = await Role.findOne({ name: user.role });
      roleAccess = role ? role.access : [];
    }

    // 🔧 Kullanıcıya ait özel access'leri de ekle
    const finalAccess = [...new Set([...(user.access || []), ...roleAccess])];

    // 🔐 JWT TOKEN oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role, access: finalAccess },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
// test
    // ✅ Başarıyla dön
    res.json({
      message: "Giriş başarılı.",
      token,
      role: user.role,
      access: finalAccess
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

    // departman bilgisini populate ile getir
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("departman", "ad"); // sadece ad alanını getirir

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({ user });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};