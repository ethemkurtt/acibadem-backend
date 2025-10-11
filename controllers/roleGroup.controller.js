// controllers/roleGroup.controller.js
const RoleGroup = require("../models/roleGroup.model");

// ---- Yardımcı: body'den izinli alanları çek ----
function pickPayload(body = {}) {
  const out = {};

  if ("roleGroupId" in body && body.roleGroupId != null) {
    out.roleGroupId = String(body.roleGroupId).trim();
  }

  if ("roleGroupName" in body && body.roleGroupName != null) {
    out.roleGroupName = String(body.roleGroupName).trim();
  }

  if ("yetkiler" in body && body.yetkiler != null) {
    // Mixed/Map olarak NE GELİRSE kabul ediyoruz (object, Map-compatible)
    // Dizi gönderildiyse de saklarız ama tipik beklenti object (key->value).
    out.yetkiler = body.yetkiler;
  }

  return out;
}

// ---- CREATE ----
exports.createRoleGroup = async (req, res) => {
  try {
    const payload = pickPayload(req.body);

    if (!payload.roleGroupId || !payload.roleGroupName) {
      return res.status(400).json({ error: "roleGroupId ve roleGroupName zorunludur." });
    }

    const exists = await RoleGroup.findOne({ roleGroupId: payload.roleGroupId }).lean();
    if (exists) {
      return res.status(409).json({ error: "roleGroupId zaten mevcut." });
    }

    const doc = await RoleGroup.create(payload);
    return res.status(201).json({ message: "Rol grubu oluşturuldu.", roleGroup: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "roleGroupId benzersiz olmalı." });
    }
    return res.status(500).json({ error: "Oluşturma hatası.", details: err.message });
  }
};

// ---- LIST ----
exports.getAllRoleGroups = async (_req, res) => {
  try {
    const rows = await RoleGroup.find().sort({ roleGroupName: 1 }).lean();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Listeleme hatası.", details: err.message });
  }
};

// ---- GET BY ID ----
exports.getRoleGroupById = async (req, res) => {
  try {
    const doc = await RoleGroup.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Kayıt bulunamadı." });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: "Getirme hatası.", details: err.message });
  }
};

// ---- UPDATE (partial) ----
exports.updateRoleGroup = async (req, res) => {
  try {
    const payload = pickPayload(req.body);

    // Hiç alan yoksa 400
    if (!Object.keys(payload).length) {
      return res.status(400).json({ error: "Güncellenecek alan bulunamadı." });
    }

    const updated = await RoleGroup.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Güncellenemedi veya kayıt bulunamadı." });

    return res.json({ message: "Güncellendi.", roleGroup: updated });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "roleGroupId benzersiz olmalı." });
    }
    return res.status(500).json({ error: "Güncelleme hatası.", details: err.message });
  }
};

// ---- DELETE ----
exports.deleteRoleGroup = async (req, res) => {
  try {
    const r = await RoleGroup.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "Silinemedi veya kayıt bulunamadı." });
    return res.json({ message: "Silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Silme hatası.", details: err.message });
  }
};
