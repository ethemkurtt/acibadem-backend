// middlewares/validation.js
const Joi = require('joi');

// Genel validation middleware
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Giriş verileri geçersiz',
        details: errorDetails
      });
    }
    
    // Validated data'yı req'e ekle
    req.validatedData = value;
    next();
  };
};

// Kullanıcı validation şemaları
const userSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Ad en az 2 karakter olmalı',
      'string.max': 'Ad en fazla 50 karakter olabilir',
      'any.required': 'Ad zorunludur'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Geçerli bir e-posta adresi giriniz',
      'any.required': 'E-posta zorunludur'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.min': 'Şifre en az 8 karakter olmalı',
      'string.pattern.base': 'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermeli',
      'any.required': 'Şifre zorunludur'
    }),
    organizasyon: Joi.string().required(),
    personelGrubu: Joi.string().required(),
    roleGroupId: Joi.string().required(),
    tc: Joi.string().pattern(/^[0-9]{11}$/).optional().messages({
      'string.pattern.base': 'TC kimlik numarası 11 haneli olmalı'
    }),
    telefon: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
      'string.pattern.base': 'Geçerli bir telefon numarası giriniz'
    }),
    mail: Joi.string().email().optional(),
    dogumTarihi: Joi.date().max('now').optional(),
    cinsiyet: Joi.string().valid('Erkek', 'Kadın', 'Diğer').optional(),
    ehliyet: Joi.boolean().optional(),
    departman: Joi.string().hex().length(24).optional(),
    lokasyonlar: Joi.array().items(Joi.string().hex().length(24)).optional(),
    lokasyon: Joi.string().hex().length(24).optional(),
    bolge: Joi.string().hex().length(24).optional(),
    ulke: Joi.string().hex().length(24).optional(),
    permissions: Joi.object().optional(),
    perms: Joi.array().items(Joi.string()).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    organizasyon: Joi.string().optional(),
    personelGrubu: Joi.string().optional(),
    roleGroupId: Joi.string().optional(),
    tc: Joi.string().pattern(/^[0-9]{11}$/).optional().allow(null),
    telefon: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(null),
    mail: Joi.string().email().optional().allow(null),
    dogumTarihi: Joi.date().max('now').optional().allow(null),
    cinsiyet: Joi.string().valid('Erkek', 'Kadın', 'Diğer').optional().allow(null),
    ehliyet: Joi.boolean().optional(),
    departman: Joi.string().hex().length(24).optional().allow(null),
    lokasyonlar: Joi.array().items(Joi.string().hex().length(24)).optional(),
    lokasyon: Joi.string().hex().length(24).optional().allow(null),
    bolge: Joi.string().hex().length(24).optional().allow(null),
    ulke: Joi.string().hex().length(24).optional().allow(null),
    permissions: Joi.object().optional(),
    perms: Joi.array().items(Joi.string()).optional()
  })
};

// Hasta talep validation şemaları
const hastaTalepSchemas = {
  create: Joi.object({
    requestType: Joi.string().valid('hasta', 'personel', 'misafir').required(),
    fullName: Joi.string().min(2).max(100).required(),
    passportNo: Joi.string().min(5).max(20).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    bolge: Joi.string().hex().length(24).required(),
    country: Joi.string().hex().length(24).required(),
    language: Joi.string().required(),
    wheelchair: Joi.string().valid('Evet', 'Hayır').default('Hayır'),
    lokasyon: Joi.string().hex().length(24).required(),
    kategori: Joi.string().required(),
    transferTipi: Joi.string().valid('Normal', 'Havalimanı Geliş', 'Havalimanı Dönüş').required(),
    transferTarihi: Joi.date().min('now').required(),
    transferSaati: Joi.string().optional(),
    donusTarihi: Joi.date().min(Joi.ref('transferTarihi')).optional(),
    donusSaati: Joi.string().optional(),
    refakatciSayisi: Joi.number().integer().min(0).default(0),
    bagajSayisi: Joi.number().integer().min(0).default(0),
    aciklama: Joi.string().max(500).optional(),
    talepEdenId: Joi.string().hex().length(24).required(),
    talepEdenAdSoyad: Joi.string().required(),
    companions: Joi.array().items(Joi.object({
      adSoyad: Joi.string().required(),
      tcPasaport: Joi.string().required(),
      telefon: Joi.string().optional(),
      yas: Joi.number().integer().min(0).optional()
    })).optional(),
    routes: Joi.array().items(Joi.object({
      pickup: Joi.object({
        date: Joi.date().required(),
        time: Joi.string().optional(),
        location: Joi.string().optional(),
        type: Joi.string().valid('hastane', 'havalimani', 'otel', 'adres').optional(),
        address: Joi.string().optional(),
        ticket: Joi.string().optional(),
        passport: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional()
      }).required(),
      drop: Joi.object({
        date: Joi.date().optional(),
        time: Joi.string().optional(),
        location: Joi.string().optional(),
        type: Joi.string().valid('hastane', 'havalimani', 'otel', 'adres').optional(),
        address: Joi.string().optional(),
        ticket: Joi.string().optional(),
        passport: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional()
      }).optional()
    })).optional(),
    notificationPerson: Joi.object({
      adSoyad: Joi.string().required(),
      telefon: Joi.string().required(),
      email: Joi.string().email().optional()
    }).optional()
  })
};

// Auth validation şemaları
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(1).required()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
  })
};

// MongoDB ObjectId validation
const objectIdSchema = Joi.string().hex().length(24).messages({
  'string.hex': 'Geçerli bir ObjectId giriniz',
  'string.length': 'ObjectId 24 karakter olmalı'
});

module.exports = {
  validateRequest,
  userSchemas,
  hastaTalepSchemas,
  authSchemas,
  objectIdSchema
};
