# 🚀 Production Deployment Rehberi

## ⚠️ Acil Durum Çözümü

Production deployment'ta `MOBILIZ_TOKEN` environment variable'ı eksikse, sistem şu anda **geçici fallback** ile çalışacak ancak **güvenlik riski** oluşturuyor.

### 🔧 Hızlı Çözüm

#### 1. Render.com'da Environment Variables Ayarla:
```bash
# Render Dashboard'da Environment Variables sekmesine git
MOBILIZ_TOKEN=43afc4b4fb2025ed2b29e4ca48705191e1584e7fcfeb1f276abe4b848f8614bc
MOBILIZ_BASE_URL=https://ng.mobiliz.com.tr/su5/api/integrations
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
MONGO_URI=your-mongodb-connection-string
```

#### 2. Diğer Zorunlu Environment Variables:
```bash
NODE_ENV=production
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_BASE_URL=https://acibadem.arndevelopment.com.tr
```

---

## 🔒 Güvenlik Notları

### ⚠️ Geçici Fallback Uyarısı
- Sistem şu anda **geçici fallback token** kullanıyor
- Bu **güvenlik riski** oluşturuyor
- **Acil olarak** `MOBILIZ_TOKEN` environment variable'ını ayarlayın

### ✅ Güvenli Production Ayarları
1. **Environment Variables** tüm production değerleri ile doldurulmalı
2. **JWT_SECRET** güçlü ve unique olmalı
3. **Database** SSL bağlantısı kullanmalı
4. **HTTPS** zorunlu olmalı

---

## 📋 Deployment Checklist

### ✅ Environment Variables Kontrolü
- [ ] `MOBILIZ_TOKEN` - Mobiliz servisi token'ı
- [ ] `JWT_SECRET` - JWT imzalama anahtarı (min 32 karakter)
- [ ] `MONGO_URI` - MongoDB bağlantı string'i
- [ ] `SMTP_*` - E-posta servisi ayarları
- [ ] `FRONTEND_BASE_URL` - Frontend URL'i

### ✅ Güvenlik Kontrolleri
- [ ] Hardcoded token'lar kaldırıldı
- [ ] JWT secret fallback kaldırıldı
- [ ] Rate limiting aktif
- [ ] Security headers aktif
- [ ] Input validation aktif

### ✅ Servis Durumu
- [ ] API server çalışıyor
- [ ] Database bağlantısı aktif
- [ ] External servisler erişilebilir
- [ ] Health check endpoint'leri çalışıyor

---

## 🛠️ Troubleshooting

### ❌ "MOBILIZ_TOKEN environment variable is required" Hatası
**Çözüm:** Environment variable'ı ayarlayın
```bash
MOBILIZ_TOKEN=your-actual-token-here
```

### ❌ "JWT_SECRET missing" Hatası
**Çözüm:** JWT secret ayarlayın
```bash
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
```

### ❌ Database Bağlantı Hatası
**Çözüm:** MongoDB URI'yi kontrol edin
```bash
MONGO_URI=mongodb://username:password@host:port/database
```

### ❌ E-posta Servisi Hatası
**Çözüm:** SMTP ayarlarını kontrol edin
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🔄 Güncelleme Notları

### v1.1.1 - Production Fix
- ✅ Lazy loading ile token kontrolü
- ✅ Geçici fallback token (acil durum için)
- ✅ Production deployment rehberi
- ✅ Environment variables şablonu güncellendi

### ⚠️ Güvenlik Uyarısı
**ÖNEMLİ:** Geçici fallback token sadece acil durum için kullanılmalı. Production'da mutlaka gerçek `MOBILIZ_TOKEN` environment variable'ını ayarlayın!

---

## 📞 Destek

Deployment sorunları için:
1. Environment variables'ları kontrol edin
2. Log dosyalarını inceleyin
3. Health check endpoint'lerini test edin
4. Database bağlantısını doğrulayın
