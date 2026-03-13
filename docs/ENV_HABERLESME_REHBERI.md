# .env Haberleşme Rehberi

Frontend ve Backend sunucularının birbirleriyle haberleşebilmesi için doğru `.env` ayarları.

## Sunucu Bilgileri

| Sunucu | IP | Port |
|--------|-----|------|
| **Frontend** | 192.168.0.46 | 80/443 |
| **Backend** | 10.6.240.64 | 5000 |

---

## 1. Backend .env (10.6.240.64 - /home/.env)

Backend sunucusunda `/home/.env` dosyası:

```env
NODE_ENV=production
PORT=5000

# MongoDB - GERÇEK connection string
MONGO_URI=mongodb://localhost:27017/acibadem
# veya Atlas: mongodb+srv://user:pass@cluster.xxx.mongodb.net/acibadem?retryWrites=true&w=majority

JWT_SECRET=min-32-karakter-gizli-anahtar-buraya
JWT_EXPIRES_IN=24h

# ⭐ FRONTEND ADRESİ - Backend bu adrese mail linki, CORS vb. için kullanır
FRONTEND_BASE_URL=http://192.168.0.46
# Domain kullanıyorsanız: https://ulasimtransfer.acibadem.com.tr

# ⭐ CORS / Socket.IO - Frontend'in erişebilmesi için izin verilen origin'ler
ALLOWED_ORIGINS=http://192.168.0.46,http://192.168.0.46:80,http://192.168.0.46:3000,https://ulasimtransfer.acibadem.com.tr

# Email (şifre sıfırlama vb.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Mobiliz (kullanıyorsanız)
MOBILIZ_TOKEN=...
```

**Önemli:** `FRONTEND_BASE_URL` ve `ALLOWED_ORIGINS` frontend sunucunun adresini göstermeli.

---

## 2. Frontend .env (192.168.0.46)

Frontend projesinde build öncesi `.env.production`:

### Vite projesi ise:
```env
VITE_API_URL=http://10.6.240.64:5000
VITE_SOCKET_URL=http://10.6.240.64:5000
```

### React CRA ise:
```env
REACT_APP_API_URL=http://10.6.240.64:5000
REACT_APP_SOCKET_URL=http://10.6.240.64:5000
```

### Next.js ise:
```env
NEXT_PUBLIC_API_URL=http://10.6.240.64:5000
NEXT_PUBLIC_SOCKET_URL=http://10.6.240.64:5000
```

**Önemli:** Bu değerler **Backend sunucunun IP:port** adresi olmalı.

---

## 3. Karşılıklı Eşleşme

```
┌─────────────────────┐                    ┌─────────────────────┐
│  FRONTEND           │                    │  BACKEND             │
│  192.168.0.46       │                    │  10.6.240.64:5000    │
├─────────────────────┤                    ├─────────────────────┤
│ VITE_API_URL=       │ ──── API istek ──► │ ALLOWED_ORIGINS=    │
│ http://10.6.240.64  │                    │ http://192.168.0.46 │
│ :5000               │                    │                     │
│                     │ ◄── CORS izni ──── │ FRONTEND_BASE_URL=  │
│                     │                    │ http://192.168.0.46 │
└─────────────────────┘                    └─────────────────────┘
```

---

## 4. Kontrol Listesi

### Backend'de (.env):
- [ ] `MONGO_URI` gerçek MongoDB adresi (placeholder değil)
- [ ] `FRONTEND_BASE_URL` = Frontend adresi (http://192.168.0.46 veya domain)
- [ ] `ALLOWED_ORIGINS` = Frontend origin'leri (virgülle ayrılmış)

### Frontend'de (.env.production):
- [ ] `VITE_API_URL` veya `REACT_APP_API_URL` = http://10.6.240.64:5000
- [ ] Build alındı: `npm run build`

### Ağ:
- [ ] 192.168.0.46 → 10.6.240.64:5000 erişilebilir (firewall açık)

---

## 5. Domain Kullanıyorsanız

Örneğin `https://ulasimtransfer.acibadem.com.tr`:

**Backend .env:**
```env
FRONTEND_BASE_URL=https://ulasimtransfer.acibadem.com.tr
ALLOWED_ORIGINS=https://ulasimtransfer.acibadem.com.tr,http://192.168.0.46
```

**Frontend .env.production:**
```env
# Nginx reverse proxy backend'e yönlendiriyorsa:
VITE_API_URL=https://ulasimtransfer.acibadem.com.tr
# veya doğrudan IP:
VITE_API_URL=http://10.6.240.64:5000
```

---

## 6. Değişiklik Sonrası

**Backend:** `npx pm2 restart acibadem-api`

**Frontend:** `.env.production` değiştiyse yeniden build: `npm run build`
