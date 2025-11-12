# ⚡ Render.com Hızlı Başlangıç

Backend projenizi Render.com'da 10 dakikada yayınlayın!

## 🎯 Hızlı Adımlar

### 1️⃣ MongoDB Atlas (Ücretsiz)

**Bağlantı String'i al:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/acibadem?retryWrites=true&w=majority
```

[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) > Create Free Cluster > Database Access > IP Whitelist (0.0.0.0/0)

---

### 2️⃣ Render Dashboard

1. [dashboard.render.com](https://dashboard.render.com) > **New +** > **Web Service**
2. GitHub repo'nuzu bağlayın
3. **Branch**: `main`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Instance**: Free veya Starter ($7/ay - önerilir)

---

### 3️⃣ Redis (Önemli - Performans İçin!)

1. Dashboard > **New +** > **Redis**
2. **Plan**: Free (25MB) veya Starter (256MB - önerilir)
3. **Region**: Web service ile **aynı** (Frankfurt önerilir)
4. **Internal Redis URL**'yi kopyalayın:
   ```
   redis://red-xxxxxxxxxxxxx:6379
   ```

---

### 4️⃣ Environment Variables

Web Service > **Environment** sekmesinden ekleyin:

```env
# Temel
NODE_ENV=production
PORT=5000

# MongoDB (Atlas'tan aldığınız)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/acibadem?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-with-at-least-32-characters-here
JWT_EXPIRES_IN=24h

# Redis (Render Redis Internal URL - ÖNEMLİ!)
REDIS_URL=redis://red-xxxxxxxxxxxxx:6379

# Email (Gmail örneği)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_SECURE=false
MAIL_FROM_NAME=Acıbadem Portal
MAIL_FROM_EMAIL=noreply@acibadem.com.tr

# Frontend
FRONTEND_BASE_URL=https://your-frontend.onrender.com

# Mobiliz (eğer kullanıyorsanız)
MOBILIZ_BASE_URL=https://ng.mobiliz.com.tr/su5/api/integrations
MOBILIZ_TOKEN=your-token

# Güvenlik
SERVICE_SECRET=service-secret-key
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 5️⃣ Deploy!

**Manual Deploy** > **Clear build cache & deploy**

Console'da şunu görmelisiniz:
```
✅ MongoDB bağlantısı başarılı
✅ Redis bağlantısı başarılı
⚡ Cache sistemi aktif - Performans optimizasyonu çalışıyor
🚀 Sunucu 5000 portunda çalışıyor
```

---

## ✅ Test

```bash
# Health check
curl https://your-service.onrender.com/api/health

# API test
curl https://your-service.onrender.com/api/talepler/list?page=1&limit=10
```

---

## ⚠️ Önemli Notlar

### Redis Mutlaka Ekleyin!

| Durum | Performans |
|-------|-----------|
| Redis yok ❌ | 3-5 saniye (yavaş!) |
| Redis var ✅ | 100-300ms (hızlı!) |

**Redis olmadan sistem çalışır ama 10-20x daha yavaş olur!**

### Internal Redis URL Kullanın

```env
# ✅ DOĞRU (Internal - ücretsiz)
REDIS_URL=redis://red-xxxxx:6379

# ❌ YANLIŞ (External - ücretli)
REDIS_URL=rediss://red-xxxxx.frankfurt-redis.render.com:6379
```

### MongoDB IP Whitelist

Atlas'ta Network Access:
- **0.0.0.0/0** (Allow from anywhere)

### Free Tier Sınırları

- 750 saat/ay
- 15 dakika boşta kalırsa sleep mode
- Cold start: ~30 saniye

**Çözüm:** Starter plan ($7/ay) - her zaman aktif

---

## 💰 Tavsiye Edilen Setup

| Servis | Plan | Maliyet |
|--------|------|---------|
| MongoDB Atlas | M0 Shared | Ücretsiz |
| Render Web Service | Starter | $7/ay |
| Render Redis | Starter | $10/ay |
| **TOPLAM** | | **$17/ay** |

**Avantajları:**
- ✅ Sleep mode yok
- ✅ Yeterli performans
- ✅ 256MB Redis (yeterli)
- ✅ Production ready

---

## 🐛 Sorun Giderme

### MongoDB bağlanamıyor

```
❌ MongoDB bağlantı hatası
```

**Çözüm:**
1. IP Whitelist: `0.0.0.0/0` ekli mi?
2. `MONGO_URI` doğru mu?
3. Şifre özel karakter içeriyorsa URL encode edin

### Redis bağlanamıyor

```
⚠️ Redis yapılandırması bulunamadı
```

**Çözüm:**
1. `REDIS_URL` environment variable var mı?
2. **Internal URL** kullanıyor musunuz?
3. Redis ve Web Service **aynı region**'da mı?

### Yavaş yanıt veriyor

**Çözüm:**
1. Redis ekleyin! (en önemli)
2. Free tier kullanıyorsanız sleep mode'dan uyandırıyor olabilir
3. Starter plan alın

---

## 📞 Yardım

Sorun yaşarsanız:
1. Render **Logs** sekmesini kontrol edin
2. MongoDB Atlas **Metrics** bakın
3. Redis bağlantısını test edin

---

## 🎓 Pro Tips

1. **Custom Domain**: SSL ücretsiz
2. **Auto-Deploy**: Git push ile otomatik
3. **Monitoring**: Metrics sekmesinden izleyin
4. **Backups**: MongoDB Atlas otomatik backup yapar

---

**Live URL:** `https://your-service-name.onrender.com`

Başarılar! 🚀

