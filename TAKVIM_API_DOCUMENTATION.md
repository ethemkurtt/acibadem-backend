# 📅 Takvim API Dokümantasyonu

## 🔐 Kimlik Doğrulama
Tüm endpoint'ler JWT token gerektirir. Header'da `Authorization: Bearer <token>` şeklinde gönderilmelidir.

---

## 📋 Endpoint'ler

### 1. **Takvim Etkinliği Oluştur**
```http
POST /api/takvim/
```

**Request Body:**
```json
{
  "baslik": "Toplantı",
  "konu": "Proje değerlendirme toplantısı",
  "baslangic_tarihi": "2025-09-26T10:00:00.000Z",
  "bitis_tarihi": "2025-09-26T11:00:00.000Z",
  "renk": "#3b82f6",
  "hatirlatma": "2025-09-26T09:30:00.000Z",
  "durum": "aktif"
}
```

**Response (201):**
```json
{
  "message": "Takvim etkinliği başarıyla oluşturuldu.",
  "etkinlik": {
    "_id": "68d56e6b3450157e947f7a92",
    "baslik": "Toplantı",
    "konu": "Proje değerlendirme toplantısı",
    "baslangic_tarihi": "2025-09-26T10:00:00.000Z",
    "bitis_tarihi": "2025-09-26T11:00:00.000Z",
    "renk": "#3b82f6",
    "hatirlatma": "2025-09-26T09:30:00.000Z",
    "durum": "aktif",
    "user": {
      "user_id": "68b068563c5b849b5e8b3fa1",
      "name": "DENİZ AYTEKİN",
      "email": "deniz.aytekin@acibadem.com"
    },
    "created_at": "2025-09-25T20:27:52.318Z",
    "updated_at": "2025-09-25T20:27:52.318Z"
  }
}
```

---

### 2. **Kullanıcının Takvim Etkinliklerini Getir**
```http
GET /api/takvim/my
```

**Query Parameters:**
- `baslangic_tarihi` (optional): Başlangıç tarihi filtresi
- `bitis_tarihi` (optional): Bitiş tarihi filtresi
- `durum` (optional): Durum filtresi (aktif, tamamlandi, iptal)
- `sayfa` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt sayısı (default: 50, max: 100)

**Example:**
```http
GET /api/takvim/my?baslangic_tarihi=2025-09-01T00:00:00.000Z&bitis_tarihi=2025-09-30T23:59:59.999Z&durum=aktif&sayfa=1&limit=20
```

**Response (200):**
```json
{
  "message": "Takvim etkinlikleri başarıyla getirildi.",
  "kullanici": {
    "user_id": "68b068563c5b849b5e8b3fa1",
    "name": "DENİZ AYTEKİN",
    "email": "deniz.aytekin@acibadem.com"
  },
  "etkinlikler": [
    {
      "_id": "68d56e6b3450157e947f7a92",
      "baslik": "Toplantı",
      "konu": "Proje değerlendirme toplantısı",
      "baslangic_tarihi": "2025-09-26T10:00:00.000Z",
      "bitis_tarihi": "2025-09-26T11:00:00.000Z",
      "renk": "#3b82f6",
      "hatirlatma": "2025-09-26T09:30:00.000Z",
      "durum": "aktif",
      "user": {
        "user_id": "68b068563c5b849b5e8b3fa1",
        "name": "DENİZ AYTEKİN",
        "email": "deniz.aytekin@acibadem.com"
      },
      "created_at": "2025-09-25T20:27:52.318Z",
      "updated_at": "2025-09-25T20:27:52.318Z"
    }
  ],
  "sayfalama": {
    "sayfa": 1,
    "limit": 20,
    "toplam_sayi": 1,
    "toplam_sayfa": 1
  }
}
```

---

### 3. **Takvim Etkinliği Detayını Getir**
```http
GET /api/takvim/:etkinlik_id
```

**Response (200):**
```json
{
  "message": "Takvim etkinliği detayı başarıyla getirildi.",
  "etkinlik": {
    "_id": "68d56e6b3450157e947f7a92",
    "baslik": "Toplantı",
    "konu": "Proje değerlendirme toplantısı",
    "baslangic_tarihi": "2025-09-26T10:00:00.000Z",
    "bitis_tarihi": "2025-09-26T11:00:00.000Z",
    "renk": "#3b82f6",
    "hatirlatma": "2025-09-26T09:30:00.000Z",
    "durum": "aktif",
    "user": {
      "user_id": "68b068563c5b849b5e8b3fa1",
      "name": "DENİZ AYTEKİN",
      "email": "deniz.aytekin@acibadem.com"
    },
    "created_at": "2025-09-25T20:27:52.318Z",
    "updated_at": "2025-09-25T20:27:52.318Z"
  }
}
```

---

### 4. **Takvim Etkinliğini Güncelle**
```http
PUT /api/takvim/:etkinlik_id
```

**Request Body:**
```json
{
  "baslik": "Güncellenmiş Toplantı",
  "konu": "Güncellenmiş proje değerlendirme toplantısı",
  "baslangic_tarihi": "2025-09-26T14:00:00.000Z",
  "bitis_tarihi": "2025-09-26T15:00:00.000Z",
  "renk": "#ef4444",
  "durum": "tamamlandi"
}
```

**Response (200):**
```json
{
  "message": "Takvim etkinliği başarıyla güncellendi.",
  "etkinlik": {
    "_id": "68d56e6b3450157e947f7a92",
    "baslik": "Güncellenmiş Toplantı",
    "konu": "Güncellenmiş proje değerlendirme toplantısı",
    "baslangic_tarihi": "2025-09-26T14:00:00.000Z",
    "bitis_tarihi": "2025-09-26T15:00:00.000Z",
    "renk": "#ef4444",
    "hatirlatma": "2025-09-26T09:30:00.000Z",
    "durum": "tamamlandi",
    "user": {
      "user_id": "68b068563c5b849b5e8b3fa1",
      "name": "DENİZ AYTEKİN",
      "email": "deniz.aytekin@acibadem.com"
    },
    "created_at": "2025-09-25T20:27:52.318Z",
    "updated_at": "2025-09-25T20:32:15.123Z"
  }
}
```

---

### 5. **Takvim Etkinliğini Sil**
```http
DELETE /api/takvim/:etkinlik_id
```

**Response (200):**
```json
{
  "message": "Takvim etkinliği başarıyla silindi.",
  "etkinlik_id": "68d56e6b3450157e947f7a92",
  "deleted_at": "2025-09-25T20:35:00.000Z"
}
```

---

### 6. **Kullanıcının Tüm Takvim Etkinliklerini Sil**
```http
DELETE /api/takvim/my/all
```

**Response (200):**
```json
{
  "message": "Tüm takvim etkinlikleri başarıyla silindi.",
  "silinen_etkinlik_sayisi": 5,
  "deleted_at": "2025-09-25T20:35:00.000Z"
}
```

---

### 7. **Yaklaşan Etkinlikleri Getir**
```http
GET /api/takvim/upcoming
```

**Query Parameters:**
- `gun_sayisi` (optional): Kaç gün sonrasına kadar (default: 7)

**Example:**
```http
GET /api/takvim/upcoming?gun_sayisi=14
```

**Response (200):**
```json
{
  "message": "Yaklaşan etkinlikler başarıyla getirildi.",
  "kullanici": {
    "user_id": "68b068563c5b849b5e8b3fa1",
    "name": "DENİZ AYTEKİN",
    "email": "deniz.aytekin@acibadem.com"
  },
  "etkinlikler": [
    {
      "_id": "68d56e6b3450157e947f7a92",
      "baslik": "Toplantı",
      "konu": "Proje değerlendirme toplantısı",
      "baslangic_tarihi": "2025-09-26T10:00:00.000Z",
      "bitis_tarihi": "2025-09-26T11:00:00.000Z",
      "renk": "#3b82f6",
      "hatirlatma": "2025-09-26T09:30:00.000Z",
      "durum": "aktif",
      "kalan_gun": 1,
      "created_at": "2025-09-25T20:27:52.318Z",
      "updated_at": "2025-09-25T20:27:52.318Z"
    }
  ],
  "toplam_etkinlik": 1,
  "gun_sayisi": 7
}
```

---

## ❌ Hata Kodları

### 400 - Bad Request
```json
{
  "error": "Başlık, konu, başlangıç tarihi ve bitiş tarihi zorunludur."
}
```

### 401 - Unauthorized
```json
{
  "error": "Token gerekli."
}
```

### 403 - Forbidden
```json
{
  "error": "Bu etkinliğe erişim yetkiniz yok."
}
```

### 404 - Not Found
```json
{
  "error": "Takvim etkinliği bulunamadı."
}
```

### 500 - Internal Server Error
```json
{
  "error": "Takvim etkinliği oluşturulamadı.",
  "details": "Database connection error"
}
```

---

## 🔄 Güncelleme Notları

### v1.0.0 - İlk Sürüm
- ✅ **Takvim modeli** - Başlık, konu, başlangıç/bitiş tarihi, renk, hatırlatma
- ✅ **CRUD operasyonları** - Oluştur, oku, güncelle, sil
- ✅ **Kullanıcı bazlı** - Her kullanıcının kendi takvimi
- ✅ **Tarih filtreleme** - Başlangıç/bitiş tarihi ile filtreleme
- ✅ **Durum yönetimi** - Aktif, tamamlandı, iptal durumları
- ✅ **Yaklaşan etkinlikler** - Belirli gün aralığındaki etkinlikler
- ✅ **Sayfalama** - Büyük veri setleri için sayfalama
- ✅ **Validation** - Joi ile input validation
- ✅ **Güvenlik** - JWT token ile kimlik doğrulama
