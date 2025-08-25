// controllers/roleGroup.controller.js
const RoleGroup = require("../models/roleGroup.model");

function pickPayload(body) {
  const out = {};
  if ("roleId"   in body) out.roleId   = String(body.roleId).trim();
  if ("roleName" in body) out.roleName = String(body.roleName).trim();

  if ("yetkiler" in body) {
    // sade kabul: { perms?: string[], permissions?: { [page]: string[] } }
    const y = body.yetkiler || {};
    out.yetkiler = {};
    if (Array.isArray(y.perms)) out.yetkiler.perms = y.perms;
    if (y.permissions && typeof y.permissions === "object" && !Array.isArray(y.permissions)) {
      out.yetkiler.permissions = y.permissions;
    }
  }
  return out;
}

// CREATE
exports.createRoleGroup = async (req, res) => {
  try {
    const payload = pickPayload(req.body);
    if (!payload.roleId || !payload.roleName) {
      return res.status(400).json({ error: "roleId ve roleName zorunludur." });
    }
    const exists = await RoleGroup.findOne({ roleId: payload.roleId });
    if (exists) return res.status(409).json({ error: "roleId zaten mevcut." });

    const doc = await RoleGroup.create(payload);
    res.status(201).json({ message: "Role grup oluşturuldu.", roleGroup: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "roleId benzersiz olmalı." });
    res.status(500).json({ error: "Oluşturma hatası.", details: err.message });
  }
};

// LIST
exports.getAllRoleGroups = async (_req, res) => {
  const rows = await RoleGroup.find().sort({ roleName: 1 }).lean();
  res.json(rows);
};

// GET BY ID
exports.getRoleGroupById = async (req, res) => {
  const doc = await RoleGroup.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: "Bulunamadı." });
  res.json(doc);
};

// UPDATE
exports.updateRoleGroup = async (req, res) => {
  try {
    const payload = pickPayload(req.body);
    const updated = await RoleGroup.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Güncellenemedi." });
    res.json({ message: "Güncellendi.", roleGroup: updated });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "roleId benzersiz olmalı." });
    res.status(500).json({ error: "Güncelleme hatası.", details: err.message });
  }
};

// DELETE
exports.deleteRoleGroup = async (req, res) => {
  const r = await RoleGroup.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ error: "Silinemedi." });
  res.json({ message: "Silindi." });
};
