#!/bin/bash
# Backend Sunucu (10.6.240.64) Deployment Script
# Kullanım: SSH ile bağlandıktan sonra bu script'i çalıştırın

set -e

PROJECT_DIR="/home"
BACKEND_URL="http://10.6.240.64:5000"  # Frontend'in backend'e erişeceği adres

echo "=== Acıbadem Backend Deployment ==="

cd "$PROJECT_DIR" || { echo "Proje dizini bulunamadı: $PROJECT_DIR"; exit 1; }

# Bağımlılıklar
echo "[1/5] Bağımlılıklar kuruluyor..."
npm install --omit=dev

# .env kontrolü
if [ ! -f .env ]; then
    echo "[2/5] .env oluşturuluyor (env.example'dan)..."
    cp env.example .env
    echo "⚠️  .env dosyasını düzenleyin: nano .env"
    echo "    MONGO_URI, JWT_SECRET, FRONTEND_BASE_URL zorunlu!"
    read -p "Devam etmek için Enter'a basın..."
else
    echo "[2/5] .env mevcut"
fi

# Eski PM2 process'leri temizle
echo "[3/5] Eski process'ler kontrol ediliyor..."
npx pm2 delete acibadem-api 2>/dev/null || true
npx pm2 delete acibadem-backend 2>/dev/null || true

# Port 5000 boş mu kontrol et
if lsof -i :5000 >/dev/null 2>&1; then
    echo "Port 5000 kullanımda. Mevcut process durduruluyor..."
    kill -9 $(lsof -t -i:5000) 2>/dev/null || true
    sleep 2
fi

# Backend başlat
echo "[4/5] Backend başlatılıyor..."
npx pm2 start server.js --name acibadem-api

# PM2 kaydet
echo "[5/5] PM2 kaydediliyor..."
npx pm2 save
npx pm2 startup 2>/dev/null || true

echo ""
echo "✅ Backend başarıyla başlatıldı!"
echo "   URL: $BACKEND_URL"
echo "   Durum: npx pm2 status"
echo "   Loglar: npx pm2 logs acibadem-api"
