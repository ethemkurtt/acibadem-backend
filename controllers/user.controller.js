const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

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
      telefon,
      mail,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Ad, email, şifre ve rol zorunludur." });
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
      telefon: telefon || null,
      mail: mail || null,
    });

    await newUser.save();

    res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user: userResponse(newUser),
    });
  } catch (err) {
    console.error("createUser hatası:", err);
    res.status(500).json({ error: "Kullanıcı oluşturulamadı." });
  }
};

// Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users.map((user) => userResponse(user)));
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    res.status(500).json({ error: "Kullanıcılar getirilemedi." });
  }
};

// Belirli kullanıcıyı getir
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // boş şifreyi güncelleme
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
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
    departman: user.departman,
    telefon: user.telefon,
    mail: user.mail,
  };
}
