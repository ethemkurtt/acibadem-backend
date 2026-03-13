#!/bin/bash
# Frontend Sunucu (192.168.0.46) - API URL Yapılandırması
# Bu script frontend projesinde API URL'ini backend sunucuya yönlendirir
#
# ÖNEMLİ: Frontend projesinin dizinini ve build tool'unu (Vite/React/Next) bilmeniz gerekir.
# Bu script örnek bir şablondur - projenize göre düzenleyin.

set -e

BACKEND_API_URL="http://10.6.240.64:5000"  # Backend sunucu adresi
# Production'da HTTPS kullanıyorsanız: https://api.ulasimtransfer.acibadem.com.tr

echo "=== Frontend API URL Yapılandırması ==="
echo "Backend API: $BACKEND_API_URL"
echo ""

# Frontend proje dizini - DEĞİŞTİRİN
FRONTEND_DIR="${FRONTEND_DIR:-/var/www/ulasimtransfer}"
# veya: FRONTEND_DIR="/home/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "⚠️  Frontend dizini bulunamadı: $FRONTEND_DIR"
    echo "   FRONTEND_DIR=/gercek/dizin ./deploy-frontend.sh şeklinde çalıştırın"
    exit 1
fi

cd "$FRONTEND_DIR"

# .env.production oluştur/güncelle
if [ -f "package.json" ]; then
    # Vite projesi
    if grep -q "vite" package.json; then
        echo "Vite projesi tespit edildi"
        echo "VITE_API_URL=$BACKEND_API_URL" > .env.production
    # React CRA
    elif grep -q "react-scripts" package.json; then
        echo "React CRA projesi tespit edildi"
        echo "REACT_APP_API_URL=$BACKEND_API_URL" > .env.production
    # Next.js
    elif grep -q "next" package.json; then
        echo "Next.js projesi tespit edildi"
        echo "NEXT_PUBLIC_API_URL=$BACKEND_API_URL" > .env.production
    else
        echo "Build tool tespit edilemedi. Manuel .env.production oluşturun:"
        echo "  VITE_API_URL=$BACKEND_API_URL"
        echo "  veya REACT_APP_API_URL=$BACKEND_API_URL"
        echo "  veya NEXT_PUBLIC_API_URL=$BACKEND_API_URL"
    fi
    
    echo ""
    echo "Build alınıyor..."
    npm run build
    
    echo "✅ Frontend build tamamlandı"
else
    echo "package.json bulunamadı. Frontend proje dizinini kontrol edin."
    exit 1
fi
