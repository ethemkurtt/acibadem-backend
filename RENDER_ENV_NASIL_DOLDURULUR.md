# 📝 Render.com Environment Variables Nasıl Doldurulur?

## 1️⃣ MONGO_URI Nasıl Alınır?

### MongoDB Atlas'tan Connection String Alma:

1. [MongoDB Atlas](https://cloud.mongodb.com) > Database > Connect
2. "Connect your application" seçin
3. Connection string'i kopyalayın:
   ```
   mongodb+srv://acibadem-user:ŞIFRENIZ@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
4. Sonuna database adını ekleyin: `/acibadem`
5. Final string:
   ```
   mongodb+srv://acibadem-user:ŞIFRENIZ@cluster0.abc123.mongodb.net/acibadem?retryWrites=true&w=majority
   ```

**Değiştirmeniz gerekenler:**
- `acibadem-user` → MongoDB kullanıcı adınız
- `ŞIFRENIZ` → MongoDB şifreniz
- `cluster0.abc123` → Cluster adınız
- `acibadem` → Database adınız

---

## 2️⃣ JWT_SECRET Nasıl Oluşturulur?

### Güçlü Rastgele Key Üretme:

**Yöntem 1 - Terminal (Node.js):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Yöntem 2 - Online:**
- [randomkeygen.com](https://randomkeygen.com) > 256-bit Key

**Örnek:**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**ÖNEMLİ:** Minimum 32 karakter olmalı!

---

## 3️⃣ REDIS_URL Nasıl Alınır?

### Render Redis Oluşturma:

1. Render Dashboard > "New +" > "Redis"
2. Name: `acibadem-redis`
3. Region: **Frankfurt (EU Central)** (Web service ile aynı!)
4. Plan: **Starter** ($10/ay - önerilir) veya Free (25MB)
5. "Create Redis" tıklayın

### Redis URL'yi Kopyalama:

Redis oluşturulduktan sonra:
1. Redis dashboard'a gidin
2. **"Internal Redis URL"** bölümünü bulun (External değil!)
3. URL'yi kopyalayın:
   ```
   redis://red-cqr6s9o8fa8c73dfgh9g:6379
   ```

**UYARI:** Mutlaka **Internal** URL kullanın! External ücretli ve yavaş.

---

## 4️⃣ SMTP Ayarları (Gmail Örneği)

### Gmail App Password Oluşturma:

1. Google Hesabı > Güvenlik > 2 Adımlı Doğrulama (aktif olmalı)
2. "Uygulama şifreleri" > "Mail" > "Diğer (Özel ad)" > "Acıbadem Backend"
3. 16 haneli şifreyi kopyalayın: `abcd efgh ijkl mnop`

**Environment Variables:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_SECURE=false
MAIL_FROM_NAME=Acıbadem Portal
MAIL_FROM_EMAIL=noreply@acibadem.com.tr
```

### Alternatif: Diğer Email Servisler

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
```

**AWS SES:**
```
SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAXXXXX
SMTP_PASS=your-ses-password
```

---

## 5️⃣ FRONTEND_BASE_URL

### Frontend URL'nizi Buraya Yazın:

**Render'da frontend deploy ettiyseniz:**
```
FRONTEND_BASE_URL=https://acibadem-frontend.onrender.com
```

**Vercel'de deploy ettiyseniz:**
```
FRONTEND_BASE_URL=https://acibadem.vercel.app
```

**Custom domain varsa:**
```
FRONTEND_BASE_URL=https://portal.acibadem.com.tr
```

---

## 6️⃣ MOBILIZ_TOKEN

### Mobiliz API Token'ı Nereden Alınır?

1. Mobiliz Dashboard'a giriş yapın
2. Settings > API Keys
3. Token'ı kopyalayın

**Eğer Mobiliz kullanmıyorsanız:**
Bu değişkeni **silmeyin**, boş bırakın veya dummy value yazın:
```
MOBILIZ_TOKEN=not-using-mobiliz
```

---

## 7️⃣ SERVICE_SECRET

### Servisler Arası İletişim Anahtarı:

Rastgele güçlü bir key oluşturun:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

**Örnek:**
```
SERVICE_SECRET=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

---

## 📋 Tam Örnek (Doldurulmuş)

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://acibadem-admin:MyP@ssw0rd123@cluster0.abc123.mongodb.net/acibadem?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
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
MOBILIZ_TOKEN=mob_1234567890abcdef
SERVICE_SECRET=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚨 Sık Yapılan Hatalar

### 1. Şifrede Özel Karakterler

**Problem:**
```
MONGO_URI=mongodb+srv://user:P@ssw0rd!@cluster...
```

**Çözüm:** Şifreyi URL encode edin:
```
@ → %40
! → %21
# → %23
$ → %24
```

**Doğru:**
```
MONGO_URI=mongodb+srv://user:P%40ssw0rd%21@cluster...
```

### 2. Redis External URL Kullanma

**Yanlış (ücretli):**
```
REDIS_URL=rediss://red-xxx.frankfurt-redis.render.com:6379
```

**Doğru (ücretsiz):**
```
REDIS_URL=redis://red-xxx:6379
```

### 3. JWT_SECRET Çok Kısa

**Yanlış:**
```
JWT_SECRET=123456
```

**Doğru (min 32 karakter):**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef
```

---

## ✅ Kontrol Listesi

Tamamladıktan sonra kontrol edin:

- [ ] `MONGO_URI` - Atlas'tan alındı, `/acibadem` eklendi
- [ ] `JWT_SECRET` - 32+ karakter rastgele
- [ ] `REDIS_URL` - Render Redis **Internal** URL
- [ ] `SMTP_*` - Gmail App Password alındı
- [ ] `FRONTEND_BASE_URL` - Frontend URL'niz
- [ ] `MOBILIZ_TOKEN` - Mobiliz'den alındı veya dummy
- [ ] `SERVICE_SECRET` - Rastgele oluşturuldu

---

## 🎯 Render'a Nasıl Eklerim?

### Yöntem 1: Web UI (Tek tek)

1. Render Dashboard > Your Service > **Environment**
2. "Add Environment Variable" tıklayın
3. Key: `NODE_ENV`, Value: `production`
4. Her değişken için tekrarlayın

### Yöntem 2: Bulk Add (Toplu)

1. Environment sekmesinde "Add from .env" veya "Bulk add"
2. `RENDER_ENV_VARIABLES.txt` dosyasının içeriğini kopyalayın
3. Yapıştırın
4. "Save" tıklayın

---

## 📞 Sorun mu var?

Environment variable ekledikten sonra:
1. **Manual Deploy** yapın (cache temizle)
2. **Logs** sekmesinden kontrol edin
3. Şunu görmelisiniz:
   ```
   ✅ MongoDB bağlantısı başarılı
   ✅ Redis bağlantısı başarılı
   ```

Hata varsa hangi değişken eksik/yanlış loglardan anlaşılır.

---

Başarılar! 🚀

