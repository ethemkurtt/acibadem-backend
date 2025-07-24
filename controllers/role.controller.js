// controllers/role.controller.js

const Role = require("../models/role.model");

// ✅ Rol oluştur
exports.createRole = async (req, res) => {
  try {
    const { name, access } = req.body;

    if (!name) return res.status(400).json({ error: "Rol adı zorunludur." });

    const newRole = new Role({
      name,
      access: access || []
    });

    await newRole.save();

    res.status(201).json({ message: "Rol oluşturuldu.", role: newRole });
  } catch (err) {
    console.error("Rol oluşturma hatası:", err);
    res.status(500).json({ error: "Rol oluşturma sırasında hata oluştu.", details: err.message });
  }
};

// ✅ Tüm rolleri getir
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Roller alınamadı.", details: err.message });
  }
};

// ✅ ID ile rol getir
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: "Rol bulunamadı." });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: "Rol getirme hatası.", details: err.message });
  }
};

// ✅ Rol güncelle
exports.updateRole = async (req, res) => {
  try {
    const updated = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Rol güncellenemedi." });
    res.json({ message: "Rol güncellendi.", role: updated });
  } catch (err) {
    res.status(500).json({ error: "Güncelleme hatası.", details: err.message });
  }
};

// ✅ Rol sil
exports.deleteRole = async (req, res) => {
  try {
    const result = await Role.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Rol silinemedi." });
    res.json({ message: "Rol silindi." });
  } catch (err) {
    res.status(500).json({ error: "Silme hatası.", details: err.message });
  }
};
