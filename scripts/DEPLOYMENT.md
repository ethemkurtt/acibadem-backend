# Sunucu Deployment Rehberi

## Sunucu Bilgileri

| Sunucu | IP | Rol |
|--------|-----|-----|
| Frontend | 192.168.0.46 | Web arayüzü |
| Backend | 10.6.240.64 | API (port 5000) |

---

## 1. Backend Sunucuya Bağlan ve Deploy Et

```bash
ssh root@10.6.240.64
```

Bağlandıktan sonra:

```bash
cd /home

# Bağımlılıklar
npm install --omit=dev

# .env yoksa oluştur
cp env.example .env
nano .env   # MONGO_URI, JWT_SECRET, FRONTEND_BASE_URL doldur

# Eski process'leri temizle
npx pm2 delete acibadem-api 2>/dev/null || true
npx pm2 delete acibadem-backend 2>/dev/null || true

# Port 5000 boşsa başlat
kill -9 $(lsof -t -i:5000) 2>/dev/null || true
sleep 2

# Başlat
npx pm2 start server.js --name acibadem-api
npx pm2 save
npx pm2 startup
```

**Kontrol:**
```bash
curl http://localhost:5000/api/health
npx pm2 status
```

---

## 2. Frontend Sunucuya Bağlan ve API URL Ayarla

```bash
ssh root@192.168.0.46
```

Frontend projesinde API URL'i **backend sunucuya** işaret etmeli:

**Backend adresi:** `http://10.6.240.64:5000`

### Vite projesi ise:
```bash
cd /path/to/frontend   # Frontend proje dizini
echo "VITE_API_URL=http://10.6.240.64:5000" > .env.production
npm run build
```

### React CRA ise:
```bash
echo "REACT_APP_API_URL=http://10.6.240.64:5000" > .env.production
npm run build
```

### Next.js ise:
```bash
echo "NEXT_PUBLIC_API_URL=http://10.6.240.64:5000" > .env.production
npm run build
```

Build sonrası static dosyaları web server'a deploy edin (nginx, apache vb.)

---

## 3. CORS ve Firewall

**Backend sunucuda** (10.6.240.64):
- Port 5000'in 192.168.0.46'dan erişilebilir olduğundan emin olun
- Firewall: `ufw allow from 192.168.0.46 to any port 5000`

**Backend .env'de** (opsiyonel):
```
ALLOWED_ORIGINS=http://192.168.0.46,http://ulasimtransfer.acibadem.com.tr,https://ulasimtransfer.acibadem.com.tr
```

---

## 4. Özet Kontrol Listesi

- [ ] Backend: `cd /home && npx pm2 start server.js --name acibadem-api`
- [ ] Backend: `curl http://localhost:5000/api/health` çalışıyor
- [ ] Frontend: .env.production'da API URL = `http://10.6.240.64:5000`
- [ ] Frontend: `npm run build` başarılı
- [ ] Ağ: 192.168.0.46 → 10.6.240.64:5000 erişilebilir
