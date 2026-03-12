# 🚀 Render.com Deployment Kılavuzu

Bu kılavuz, backend projesini Render.com'da yayınlamak için gereken tüm adımları detaylı şekilde açıklar.

## 📋 Ön Gereksinimler

- ✅ GitHub/GitLab hesabı ve proje repository'si
- ✅ Render.com hesabı (ücretsiz başlayabilirsiniz)
- ✅ MongoDB Atlas hesabı (veya başka bir MongoDB servisi)

## 🎯 1. MongoDB Atlas Kurulumu (Eğer Yoksa)

### 1.1 MongoDB Atlas'ta Cluster Oluştur

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) adresine gidin
2. "Build a Database" > "Shared" (Free) seçin
3. Cloud Provider: **AWS** veya **Google Cloud** (Render'a yakın region seçin)
4. Region: **Europe (Frankfurt)** veya **US East (N. Virginia)** (Render'a yakın olan)
5. Cluster Name: `acibadem-cluster`
6. "Create Cluster" butonuna tıklayın

### 1.2 Database User Oluştur

1. Sol menüden "Database Access" > "Add New Database User"
2. Authentication Method: **Password**
3. Username: `acibadem-admin` (veya istediğiniz)
4. Password: Güçlü bir şifre oluşturun (kaydedin!)
5. Database User Privileges: **Read and write to any database**
6. "Add User" butonuna tıklayın

### 1.3 Network Access Ayarla

1. Sol menüden "Network Access" > "Add IP Address"
2. "Allow Access from Anywhere" (0.0.0.0/0) seçin
3. "Confirm" butonuna tıklayın

### 1.4 Connection String Al

1. "Database" > "Connect" > "Connect your application"
2. Driver: **Node.js**, Version: **4.1 or later**
3. Connection string'i kopyalayın:
   ```
   mongodb+srv://acibadem-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. `<password>` kısmını gerçek şifrenizle değiştirin

---

## 🔧 2. Render.com'da Web Service Oluştur

### 2.1 Yeni Web Service

1. [Render Dashboard](https://dashboard.render.com/) > "New +" > "Web Service"
2. Repository'nizi bağlayın (GitHub/GitLab)
3. Projenizi seçin: `backend-acibadem`

### 2.2 Temel Ayarlar

| Alan | Değer |
|------|-------|
| **Name** | `acibadem-backend` (veya istediğiniz) |
| **Region** | **Frankfurt (EU Central)** (Türkiye'ye yakın) |
| **Branch** | `main` veya `master` |
| **Root Directory** | Boş bırakın (proje root'ta) |
| **Runtime** | **Node** |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** (başlangıç için) veya **Starter** |

---

## 🔴 3. Redis Kurulumu (ÖNEMLİ - Performans İçin)

### 3.1 Redis Instance Oluştur

1. Render Dashboard > "New +" > "Redis"
2. **Name**: `acibadem-redis`
3. **Region**: Web service ile **aynı region** (Frankfurt)
4. **Plan**: **Free** (25MB) veya **Starter** (256MB - önerilir)
5. "Create Redis" butonuna tıklayın

### 3.2 Redis Connection Info Al

Redis instance oluşturulduktan sonra:
1. Redis dashboard'unuza gidin
2. **Internal Redis URL** kopyalayın (şuna benzer):
   ```
   redis://red-xxxxxxxxxxxxx:6379
   ```
3. Bu URL'yi web service environment variable'larına ekleyeceğiz

> **ÖNEMLİ:** Internal URL kullanın (External değil), daha hızlı ve ücretsiz!

---

## ⚙️ 4. Environment Variables Ayarla

Web service'inizin **Environment** sekmesinden şu değişkenleri ekleyin:

### 4.1 Temel Ayarlar

```env
# Application
NODE_ENV=production
PORT=5000

# Database (MongoDB Atlas'tan aldığınız)
MONGO_URI=mongodb+srv://acibadem-admin:ŞIFRENIZ@cluster0.xxxxx.mongodb.net/acibadem?retryWrites=true&w=majority

# JWT
JWT_SECRET=super-gizli-jwt-secret-key-min-32-karakter-olsun
JWT_EXPIRES_IN=24h
```

### 4.2 Redis (Performans İçin - ÖNEMLİ!)

```env
# Redis (Render Redis Internal URL)
REDIS_URL=redis://red-xxxxxxxxxxxxx:6379
```

**veya ayrı parametreler:**

```env
REDIS_HOST=red-xxxxxxxxxxxxx-6379.frankfurt-redis.render.com
REDIS_PORT=6379
```

> **NOT:** Redis yoksa sistem yine çalışır ama **10-20x daha yavaş** olur!

### 4.3 Email Ayarları (Gmail Örneği)

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
MAIL_FROM_NAME=Acıbadem Portal
MAIL_FROM_EMAIL=noreply@acibadem.com.tr
```

**Gmail App Password Alma:**
1. Google Hesap Ayarları > Güvenlik > 2 Adımlı Doğrulama
2. "Uygulama şifreleri" > "Mail" seçin
3. Oluşturulan şifreyi `SMTP_PASS` olarak kullanın

### 4.4 Frontend ve Servisler

```env
# Frontend URL (Render'daki frontend URL'niz)
FRONTEND_BASE_URL=https://acibadem-frontend.onrender.com

# Mobiliz (Eğer kullanıyorsanız)
MOBILIZ_BASE_URL=https://ng.mobiliz.com.tr/su5/api/integrations
MOBILIZ_TOKEN=your-mobiliz-token

# Service Communication
SERVICE_SECRET=servisler-arasi-iletisim-secret-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📝 5. Tam Environment Variables Örneği

Render'da Environment Variables ekranına aşağıdaki formatta girin:

```env
NODE_ENV=production
PORT=5000

MONGO_URI=mongodb+srv://acibadem-admin:MyStrongPassword123@cluster0.abc123.mongodb.net/acibadem?retryWrites=true&w=majority

JWT_SECRET=my-super-secret-jwt-key-with-at-least-32-characters
JWT_EXPIRES_IN=24h

REDIS_URL=redis://red-cqr6s9o8fa8c73dfgh9g:6379

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@example.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_SECURE=false
MAIL_FROM_NAME=Acıbadem Portal
MAIL_FROM_EMAIL=noreply@acibadem.com.tr

FRONTEND_BASE_URL=https://acibadem-frontend.onrender.com

MOBILIZ_BASE_URL=https://ng.mobiliz.com.tr/su5/api/integrations
MOBILIZ_TOKEN=your-token-here

SERVICE_SECRET=service-to-service-secret
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎯 6. Deploy!

1. Tüm environment variable'ları ekledikten sonra
2. "Manual Deploy" > "Deploy latest commit" veya
3. Git'e push yapın (otomatik deploy)

### 6.1 Deployment Süreci

```
Building...          (2-3 dakika)
├── npm install      
└── Dependencies OK  

Starting...          (30 saniye)
├── MongoDB bağlantısı ✅
├── Redis bağlantısı ✅
└── Server başlatıldı 🚀

Live! ✨ https://acibadem-backend.onrender.com
```

### 6.2 Console Loglarını Kontrol Et

Deployment tamamlandıktan sonra "Logs" sekmesinden şunları görmeli:

```
✅ MongoDB bağlantısı başarılı
✅ Redis bağlantısı başarılı
⚡ Cache sistemi aktif - Performans optimizasyonu çalışıyor
🚀 Sunucu 5000 portunda çalışıyor
```

**Redis yoksa:**
```
⚠️  Redis yapılandırması bulunamadı. Cache devre dışı.
```

---

## 🧪 7. Test Et

### 7.1 Health Check

```bash
curl https://acibadem-backend.onrender.com/api/health
```

### 7.2 API Test

```bash
# Talepler listesi
curl https://acibadem-backend.onrender.com/api/talepler/list?page=1&limit=10

# İş atamaları (yetkilendirme gerekir)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://acibadem-backend.onrender.com/api/talepler/is-atamalarim
```

---

## 🚨 Sık Karşılaşılan Sorunlar

### 1. MongoDB Bağlantı Hatası

**Hata:**
```
❌ MongoDB bağlantı hatası: MongoServerError
```

**Çözüm:**
- MongoDB Atlas'ta IP whitelist'e `0.0.0.0/0` eklenmiş mi?
- `MONGO_URI` doğru mu? (Şifre özel karakterler içeriyorsa encode edin)
- Database name var mı? (`/acibadem` kısmı)

### 2. Redis Bağlanamıyor

**Hata:**
```
❌ Redis bağlantı hatası
```

**Çözüm:**
- Render Redis Instance aynı region'da mı?
- **Internal Redis URL** kullanıyor musunuz? (External değil!)
- `REDIS_URL` environment variable'ı doğru mu?

### 3. Server Başlamıyor

**Hata:**
```
Error: Cannot find module 'redis'
```

**Çözüm:**
```bash
# package.json'a redis ekliyse
npm install
# commit & push
```

### 4. Free Tier Limitler

Render Free Tier:
- 750 saat/ay çalışma süresi
- 15 dakika boşta kalırsa sleep mode
- Cold start: ~30 saniye

**Çözüm:** Production için **Starter Plan** ($7/ay) alın:
- Her zaman aktif
- Daha fazla RAM (512MB)
- Daha hızlı

---

## 💰 Maliyet Tahmini

### Ücretsiz Seçenek

| Servis | Plan | Maliyet |
|--------|------|---------|
| MongoDB Atlas | Shared (M0) | **Ücretsiz** |
| Render Web Service | Free | **Ücretsiz** (750h/ay) |
| Render Redis | Free | **Ücretsiz** (25MB) |
| **TOPLAM** | | **$0/ay** |

**Kısıtlar:**
- Sleep mode (15 dk boşta kalırsa)
- Redis sadece 25MB (yeterli olabilir)
- Cold start süresi ~30 saniye

### Önerilen Production Setup

| Servis | Plan | Maliyet |
|--------|------|---------|
| MongoDB Atlas | M2 | **$9/ay** |
| Render Web Service | Starter | **$7/ay** |
| Render Redis | Starter | **$10/ay** |
| **TOPLAM** | | **$26/ay** |

**Avantajlar:**
- ✅ Her zaman aktif
- ✅ Yeterli RAM/Storage
- ✅ Cold start yok
- ✅ Hızlı performans

---

## 🔒 Güvenlik Önerileri

1. **JWT Secret**: Rastgele, minimum 32 karakter
   ```bash
   # Terminal'de oluştur
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MongoDB**: Read-only user'lar için ayrı user oluştur

3. **Environment Variables**: Asla Git'e commit etmeyin!

4. **CORS**: Production'da sadece frontend domain'ine izin ver

5. **Rate Limiting**: Aktif tutun (zaten var)

---

## 📊 Monitoring ve Bakım

### Render Dashboard'dan İzleyin:

1. **Metrics**: CPU, Memory, Request Count
2. **Logs**: Real-time application logs
3. **Events**: Deployment history

### MongoDB Atlas'tan İzleyin:

1. **Metrics**: Connection count, Operations
2. **Performance Advisor**: Index önerileri
3. **Alerts**: Disk/RAM kullanımı

### Redis Monitoring:

```bash
# Render Redis CLI (dashboard'dan)
INFO stats
DBSIZE
```

---

## 🎓 İpuçları

1. **Custom Domain**: Render'da ücretsiz SSL ile custom domain ekleyebilirsiniz

2. **Auto-Deploy**: `main` branch'e push olunca otomatik deploy

3. **Preview Environments**: PR'lar için otomatik preview URL'leri

4. **Background Workers**: Ayrı worker service ekleyebilirsiniz

5. **Cron Jobs**: Render Cron Jobs kullanabilirsiniz

---

## 📞 Destek

Sorun yaşarsanız:
1. Render Logs'u kontrol edin
2. MongoDB Atlas Metrics'e bakın
3. Redis bağlantısını test edin

---

**Başarılar! 🚀**

Render deployment'ınız başarılı olduğunda şu URL'den erişebilirsiniz:
`https://your-service-name.onrender.com`

