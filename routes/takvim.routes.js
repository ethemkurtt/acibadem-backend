const express = require("express");
const router = express.Router();
const takvimController = require("../controllers/takvim.controller");
const { authRequired } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validation");
const Joi = require("joi");

// Validation şemaları
const takvimSchemas = {
  create: Joi.object({
    baslik: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Başlık en az 1 karakter olmalı',
      'string.max': 'Başlık en fazla 200 karakter olabilir',
      'any.required': 'Başlık zorunludur'
    }),
    konu: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Konu en az 1 karakter olmalı',
      'string.max': 'Konu en fazla 1000 karakter olabilir',
      'any.required': 'Konu zorunludur'
    }),
    baslangic_tarihi: Joi.date().iso().required().messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz',
      'date.format': 'Başlangıç tarihi ISO formatında olmalı (YYYY-MM-DDTHH:mm:ss.sssZ)',
      'any.required': 'Başlangıç tarihi zorunludur'
    }),
    bitis_tarihi: Joi.date().iso().required().messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz',
      'date.format': 'Bitiş tarihi ISO formatında olmalı (YYYY-MM-DDTHH:mm:ss.sssZ)',
      'any.required': 'Bitiş tarihi zorunludur'
    }),
    renk: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
      'string.pattern.base': 'Renk hex formatında olmalı (#RRGGBB)'
    }),
    hatirlatma: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir hatırlatma tarihi giriniz',
      'date.format': 'Hatırlatma tarihi ISO formatında olmalı'
    }),
    durum: Joi.string().valid('aktif', 'tamamlandi', 'iptal').optional().messages({
      'any.only': 'Durum aktif, tamamlandi veya iptal olmalı'
    })
  }).custom((value, helpers) => {
    // Bitiş tarihi başlangıç tarihinden sonra olmalı
    if (new Date(value.bitis_tarihi) < new Date(value.baslangic_tarihi)) {
      return helpers.error('custom.dateRange');
    }
    return value;
  }).messages({
    'custom.dateRange': 'Bitiş tarihi başlangıç tarihinden önce olamaz'
  }),

  update: Joi.object({
    baslik: Joi.string().min(1).max(200).optional().messages({
      'string.min': 'Başlık en az 1 karakter olmalı',
      'string.max': 'Başlık en fazla 200 karakter olabilir'
    }),
    konu: Joi.string().min(1).max(1000).optional().messages({
      'string.min': 'Konu en az 1 karakter olmalı',
      'string.max': 'Konu en fazla 1000 karakter olabilir'
    }),
    baslangic_tarihi: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz',
      'date.format': 'Başlangıç tarihi ISO formatında olmalı'
    }),
    bitis_tarihi: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz',
      'date.format': 'Bitiş tarihi ISO formatında olmalı'
    }),
    renk: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
      'string.pattern.base': 'Renk hex formatında olmalı (#RRGGBB)'
    }),
    hatirlatma: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir hatırlatma tarihi giriniz',
      'date.format': 'Hatırlatma tarihi ISO formatında olmalı'
    }),
    durum: Joi.string().valid('aktif', 'tamamlandi', 'iptal').optional().messages({
      'any.only': 'Durum aktif, tamamlandi veya iptal olmalı'
    })
  }).custom((value, helpers) => {
    // Eğer hem başlangıç hem bitiş tarihi verilmişse kontrol et
    if (value.baslangic_tarihi && value.bitis_tarihi) {
      if (new Date(value.bitis_tarihi) < new Date(value.baslangic_tarihi)) {
        return helpers.error('custom.dateRange');
      }
    }
    return value;
  }).messages({
    'custom.dateRange': 'Bitiş tarihi başlangıç tarihinden önce olamaz'
  }),

  query: Joi.object({
    baslangic_tarihi: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir başlangıç tarihi giriniz',
      'date.format': 'Başlangıç tarihi ISO formatında olmalı'
    }),
    bitis_tarihi: Joi.date().iso().optional().messages({
      'date.base': 'Geçerli bir bitiş tarihi giriniz',
      'date.format': 'Bitiş tarihi ISO formatında olmalı'
    }),
    durum: Joi.string().valid('aktif', 'tamamlandi', 'iptal').optional().messages({
      'any.only': 'Durum aktif, tamamlandi veya iptal olmalı'
    }),
    sayfa: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Sayfa numarası sayı olmalı',
      'number.integer': 'Sayfa numarası tam sayı olmalı',
      'number.min': 'Sayfa numarası en az 1 olmalı'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Limit sayı olmalı',
      'number.integer': 'Limit tam sayı olmalı',
      'number.min': 'Limit en az 1 olmalı',
      'number.max': 'Limit en fazla 100 olabilir'
    })
  })
};

// ✅ Takvim etkinliği oluştur
router.post("/", authRequired, validateRequest(takvimSchemas.create), takvimController.createTakvimEtkinligi);

// ✅ Kullanıcının takvim etkinliklerini getir
router.get("/my", authRequired, validateRequest(takvimSchemas.query, 'query'), takvimController.getMyTakvimEtkinlikleri);

// ✅ Yaklaşan etkinlikleri getir
router.get("/upcoming", authRequired, takvimController.getYaklasanEtkinlikler);

// ✅ Takvim etkinliği detayını getir
router.get("/:etkinlik_id", authRequired, takvimController.getTakvimEtkinligiDetay);

// ✅ Takvim etkinliğini güncelle
router.put("/:etkinlik_id", authRequired, validateRequest(takvimSchemas.update), takvimController.updateTakvimEtkinligi);

// ✅ Takvim etkinliğini sil
router.delete("/:etkinlik_id", authRequired, takvimController.deleteTakvimEtkinligi);

// ✅ Kullanıcının tüm takvim etkinliklerini sil
router.delete("/my/all", authRequired, takvimController.deleteAllMyTakvimEtkinlikleri);

module.exports = router;
