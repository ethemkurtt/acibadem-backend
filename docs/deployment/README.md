# Deployment Rehberi

Acıbadem Backend deployment dokümantasyonu.

## Dokümanlar

| Doküman | Açıklama |
|---------|----------|
| [Render Hızlı Başlangıç](RENDER_QUICK_START.md) | 10 dakikada Render.com'da yayınlama |
| [Render Detaylı Kılavuz](RENDER_DEPLOYMENT.md) | Adım adım Render deployment |
| [Environment Variables](RENDER_ENV_NASIL_DOLDURULUR.md) | Env değişkenleri nasıl doldurulur |
| [Production Checklist](DEPLOYMENT_GUIDE.md) | Güvenlik ve production kontrol listesi |

## Hızlı Özet

1. **MongoDB Atlas** – Ücretsiz cluster oluştur, connection string al
2. **Render Web Service** – Repo bağla, `npm install` / `npm start`
3. **Render Redis** – Internal URL kullan (performans için zorunlu)
4. **Environment Variables** – Tüm değişkenleri ekle
5. **Deploy** – Manual veya otomatik

## Önemli Notlar

- **Redis** olmadan sistem 10-20x daha yavaş çalışır
- **Internal Redis URL** kullanın (External ücretli)
- **JWT_SECRET** minimum 32 karakter olmalı
- **MOBILIZ_TOKEN** production'da mutlaka ayarlanmalı
