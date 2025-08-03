const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

// Kullanıcı oluştur
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      access,
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
    } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Ad, email, şifre ve rol zorunludur." });
    }

    // ✅ Access kontrolü (1-100 arası)
    if (access && (!Array.isArray(access) || access.some((v) => v < 1 || v > 100))) {
      return res
        .status(400)
        .json({ error: "Access değerleri 1 ile 100 arasında olmalıdır." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      access: access || [],
      tc: tc || null,
      departman: departman || null,
      lokasyon: lokasyon || null,
      bolge: bolge || null,
      ulke: ulke || null,
      telefon: telefon || null,
      mail: mail || null,
      dogumTarihi: dogumTarihi || null,
      cinsiyet: cinsiyet || null,
      ehliyet: ehliyet || false,
    });

    await newUser.save();

    const populatedUser = await User.findById(newUser._id)
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: userResponse(populatedUser),
    });
  } catch (err) {
    console.error("createUser hatası:", err);
    res.status(500).json({ error: "Kullanıcı oluşturulamadı." });
  }
};

// Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ name: 1 })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    res.json(users.map((user) => userResponse(user)));
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    res.status(500).json({ error: "Kullanıcılar getirilemedi." });
  }
};

// Belirli kullanıcıyı getir
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json(userResponse(user));
  } catch (err) {
    console.error("getUserById hatası:", err);
    res.status(500).json({ error: "Kullanıcı getirilemedi." });
  }
};

// Kullanıcıyı güncelle
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // ✅ Access kontrolü (1-100 arası)
    if (
      updateData.access &&
      (!Array.isArray(updateData.access) ||
        updateData.access.some((v) => v < 1 || v > 100))
    ) {
      return res
        .status(400)
        .json({ error: "Access değerleri 1 ile 100 arasında olmalıdır." });
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // boş şifreyi güncelleme
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate("departman", "ad")
      .populate("lokasyon", "ad")
      .populate("bolge", "ad")
      .populate("ulke", "ad");

    if (!updated)
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({
      message: "Kullanıcı güncellendi.",
      user: userResponse(updated),
    });
  } catch (err) {
    console.error("updateUser hatası:", err);
    res.status(500).json({ error: "Güncelleme başarısız." });
  }
};

// Kullanıcı sil
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({ message: "Kullanıcı silindi.", id: deleted._id });
  } catch (err) {
    console.error("deleteUser hatası:", err);
    res.status(500).json({ error: "Silme işlemi başarısız." });
  }
};

// ✨ Kullanıcıdan hassas bilgileri filtrele
function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    access: user.access,
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
