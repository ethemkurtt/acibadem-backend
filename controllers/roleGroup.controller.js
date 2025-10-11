// controllers/roleGroup.controller.js
const mongoose = require("mongoose");
const RoleGroup = require("../models/roleGroup.model");
const { encodeKeys, decodeKeys } = require("../utils/dotKeyCodec");

// ---- Yardımcı: body'den izinli alanları çek + yetkiler encode ----
function pickPayload(body = {}) {
  const out = {};

  if ("roleGroupId" in body && body.roleGroupId != null) {
    out.roleGroupId = String(body.roleGroupId).trim();
  }

  if ("roleGroupName" in body && body.roleGroupName != null) {
    out.roleGroupName = String(body.roleGroupName).trim();
  }

  if ("yetkiler" in body && body.yetkiler != null) {
    // Nokta/dolar içeren anahtarları DB güvenli hale getir
    if (typeof body.yetkiler === "object" && !Array.isArray(body.yetkiler)) {
      out.yetkiler = encodeKeys(body.yetkiler);
    } else {
      // Objeden farklı bir şey (ör. dizi) gelirse olduğu gibi kaydetmeyelim;
      // yine de Mixed map içine koyacağız, ama encodeKeys korumasından geçsin.
      out.yetkiler = encodeKeys(body.yetkiler);
    }
  }

  return out;
}

// :id hem _id (ObjectId) hem de roleGroupId olabilir
function buildIdQuery(idParam) {
  const id = String(idParam || "").trim();
  if (mongoose.Types.ObjectId.isValid(id)) return { _id: id };
  return { roleGroupId: id };
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
    // Model'in toJSON'unda Map decode yapılıyor; create dönen doc da toJSON ile dönerken decode olur.
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
    // lean() kullandığımız için Map->decode işini burada manuel yapalım
    const rows = await RoleGroup.find().sort({ roleGroupName: 1 }).lean();
    const decoded = rows.map(r => {
      const out = { ...r };
      if (out.yetkiler && typeof out.yetkiler === "object" && !Array.isArray(out.yetkiler)) {
        out.yetkiler = decodeKeys(out.yetkiler);
      }
      return out;
    });
    return res.json(decoded);
  } catch (err) {
    return res.status(500).json({ error: "Listeleme hatası.", details: err.message });
  }
};

// ---- GET BY ID ----
exports.getRoleGroupById = async (req, res) => {
  try {
    const query = buildIdQuery(req.params.id);
    const doc = await RoleGroup.findOne(query).lean();
    if (!doc) return res.status(404).json({ error: "Kayıt bulunamadı." });

    const out = { ...doc };
    if (out.yetkiler && typeof out.yetkiler === "object" && !Array.isArray(out.yetkiler)) {
      out.yetkiler = decodeKeys(out.yetkiler);
    }
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ error: "Getirme hatası.", details: err.message });
  }
};

// ---- UPDATE (partial) ----
exports.updateRoleGroup = async (req, res) => {
  try {
    const payload = pickPayload(req.body);

    if (!Object.keys(payload).length) {
      return res.status(400).json({ error: "Güncellenecek alan bulunamadı." });
    }

    const query = buildIdQuery(req.params.id);

    const updated = await RoleGroup.findOneAndUpdate(
      query,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Güncellenemedi veya kayıt bulunamadı." });

    // updated, toJSON ile dönerken model transform çalışır (decode)
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
    const query = buildIdQuery(req.params.id);
    const r = await RoleGroup.findOneAndDelete(query);
    if (!r) return res.status(404).json({ error: "Silinemedi veya kayıt bulunamadı." });
    return res.json({ message: "Silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Silme hatası.", details: err.message });
  }
};
