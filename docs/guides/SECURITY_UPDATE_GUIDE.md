# Acıbadem Backend - Güvenlik Güncellemeleri Rehberi

## 🚀 Kurulum ve Çalıştırma

### 1. Dependency'leri Yükle
```bash
npm install
```

### 2. Environment Variables Ayarla
```bash
# env.example dosyasını .env olarak kopyala
cp env.example .env

# .env dosyasını düzenle ve gerçek değerleri gir
nano .env
```

### 3. Çalıştırma Seçenekleri

#### A. Sadece API Server (Eski Yöntem)
```bash
npm run dev
# veya
npm start
```

#### B. API Gateway ile (Önerilen)
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: API Gateway
npm run dev:gateway
```

#### C. Her İkisini Birden (Development)
```bash
npm run dev:all
```

## 🔧 Yapılan Güvenlik Güncellemeleri

### ✅ Kritik Düzeltmeler
1. **Hardcoded Token Kaldırıldı**
   - `utils/axiosMobiliz.js` - MOBILIZ_TOKEN environment variable'a taşındı
   
2. **JWT Secret Fallback Kaldırıldı**
   - `controllers/auth.controller.js` - Fallback "dev-secret" kaldırıldı
   
3. **Token Süresi Kısaltıldı**
   - JWT token süresi 7 günden 1 saate düşürüldü

### ✅ Güvenlik Middleware'leri
1. **Helmet.js** - Güvenlik headers
2. **Rate Limiting** - API endpoint'leri için
3. **CORS** - Cross-origin resource sharing
4. **Input Validation** - Joi ile standardize edildi

### ✅ Servisler Arası İletişim
1. **Service-to-Service Authentication**
2. **Service Token Sistemi**
3. **Service Communication Middleware**

### ✅ API Gateway
1. **Merkezi Authentication**
2. **Request Routing**
3. **Rate Limiting**
4. **Health Check Endpoints**

## 🌐 Endpoint'ler

### Public Endpoints (Authentication Gerekmez)
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/forgot` - Şifre sıfırlama
- `GET /auth/reset/verify` - Token doğrulama
- `POST /auth/reset` - Yeni şifre belirleme
- `GET /health` - Sistem durumu

### Protected Endpoints (Authentication Gerekir)
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Yeni kullanıcı
- `PUT /api/users/:id` - Kullanıcı güncelleme
- `GET /api/hasta-talep` - Hasta talepleri
- `POST /api/hasta-talep` - Yeni hasta talebi
- Ve diğer tüm API endpoint'leri...

## 🔒 Güvenlik Özellikleri

### Authentication & Authorization
- JWT tabanlı authentication
- Rol tabanlı yetkilendirme (RBAC)
- Service-to-service authentication
- Token expiration (1 saat)

### Input Validation
- Joi schema validation
- SQL injection koruması
- XSS koruması
- CSRF koruması

### Rate Limiting
- Genel API: 100 istek/15 dakika
- Auth endpoints: 5 istek/15 dakika
- Login: 10 istek/1 dakika

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 🚨 Önemli Notlar

### Environment Variables
Aşağıdaki environment variables'lar **ZORUNLU**:
- `JWT_SECRET` - Minimum 32 karakter
- `MOBILIZ_TOKEN` - Mobiliz servisi token'ı
- `MONGO_URI` - MongoDB bağlantı string'i
- `SERVICE_SECRET` - Servisler arası iletişim için

### Production Deployment
1. **HTTPS** kullanın
2. **Environment variables**'ları güvenli şekilde saklayın
3. **Database** bağlantısını SSL ile yapın
4. **Logging** sistemini aktif edin
5. **Monitoring** sistemi kurun

### Penetrasyon Testi Öncesi
- [x] Hardcoded token'lar kaldırıldı
- [x] JWT secret fallback kaldırıldı
- [x] Token süresi kısaltıldı
- [x] Input validation eklendi
- [x] Rate limiting eklendi
- [x] Security headers eklendi
- [x] API Gateway implementasyonu
- [x] Service-to-service authentication

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. Environment variables'ları doğrulayın
3. Database bağlantısını test edin
4. Port çakışması olup olmadığını kontrol edin

## 🔄 Güncelleme Notları

### v1.1.0 - Güvenlik Güncellemeleri
- Kritik güvenlik açıkları kapatıldı
- API Gateway eklendi
- Servisler arası authentication eklendi
- Input validation standardize edildi
- Güvenlik headers eklendi

