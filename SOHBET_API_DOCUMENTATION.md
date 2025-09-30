# Sohbet API Dokümantasyonu

## 📱 Sohbet Sistemi API Endpoint'leri

### 🔐 Authentication
Tüm endpoint'ler JWT token gerektirir. Header'da `Authorization: Bearer <token>` şeklinde gönderilmelidir.

---

## 📋 Endpoint'ler

### 1. **Yeni Sohbet Başlat**
```http
POST /api/sohbet
```

**Request Body:**
```json
{
  "hedef_user_id": "64a1b2c3d4e5f6789012345",
  "sohbet_tipi": "genel" // opsiyonel
}
```

**Response (201):**
```json
{
  "message": "Sohbet başarıyla oluşturuldu.",
  "sohbet": {
    "_id": "64a1b2c3d4e5f6789012346",
    "sohbet_id": "64a1b2c3d4e5f6789012346",
    "sohbet_tipi": "genel",
    "baslatan_user_id": {
      "_id": "64a1b2c3d4e5f6789012347",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com"
    },
    "katilimcilar": [
      {
        "user_id": "64a1b2c3d4e5f6789012347",
        "name": "Ahmet Yılmaz",
        "email": "ahmet@example.com",
        "role": "baslatan"
      },
      {
        "user_id": "64a1b2c3d4e5f6789012345",
        "name": "Mehmet Kaya",
        "email": "mehmet@example.com",
        "role": "katilimci"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. **Mesaj Gönder**
```http
POST /api/sohbet/mesaj
```

**Request Body:**
```json
{
  "sohbet_id": "64a1b2c3d4e5f6789012346",
  "message": "Merhaba, nasılsın?"
}
```

**Response (201):**
```json
{
  "message": "Mesaj başarıyla gönderildi.",
  "data": {
    "mesaj_id": "64a1b2c3d4e5f6789012348",
    "message": "Merhaba, nasılsın?",
    "time": "2024-01-15T10:35:00.000Z",
    "okunma_tarihi": null,
    "sender": {
      "user_id": "64a1b2c3d4e5f6789012347",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com"
    }
  }
}
```

---

### 3. **Kullanıcının Sohbetlerini Getir**
```http
GET /api/sohbet/my
```

**Response (200):**
```json
{
  "message": "Sohbetler başarıyla getirildi.",
  "kullanici": {
    "user_id": "68b068563c5b849b5e8b3fa1",
    "name": "DENİZ AYTEKİN",
    "email": "deniz.aytekin@acibadem.com"
  },
  "sohbetler": [
    {
      "sohbet_id": "68d56e6b3450157e947f7a92",
      "sohbet_tipi": null,
      
      "ben": {
        "user_id": "68b068563c5b849b5e8b3fa1",
        "name": "DENİZ AYTEKİN",
        "email": "deniz.aytekin@acibadem.com",
        "role": "katilimci"
      },
      
      "baslatan_user": {
        "user_id": "68b068563c5b849b5e8b3fa1",
        "name": "DENİZ AYTEKİN",
        "email": "deniz.aytekin@acibadem.com",
        "role": "baslatan"
      },
      
      "sohbet_ettigi_kisiler": [
        {
          "user_id": "68c1234567890abcdef12345",
          "name": "AHMET YILMAZ",
          "email": "ahmet.yilmaz@acibadem.com",
          "joined_at": "2025-09-25T16:31:39.387Z",
          "role": "katilimci"
        }
      ],
      
      "tum_katilimcilar": [
        {
          "user_id": "68b068563c5b849b5e8b3fa1",
          "name": "DENİZ AYTEKİN",
          "email": "deniz.aytekin@acibadem.com",
          "joined_at": "2025-09-25T16:31:39.387Z",
          "role": "baslatan"
        },
        {
          "user_id": "68c1234567890abcdef12345",
          "name": "AHMET YILMAZ",
          "email": "ahmet.yilmaz@acibadem.com",
          "joined_at": "2025-09-25T16:31:39.387Z",
          "role": "katilimci"
        }
      ],
      
      "son_mesaj": {
        "mesaj_id": "68d56e6b3450157e947f7a96",
        "message": "Merhaba!",
        "time": "2025-09-25T16:32:15.123Z",
        "sender": {
          "user_id": "68b068563c5b849b5e8b3fa1",
          "name": "DENİZ AYTEKİN"
        }
      },
      
      "okunmamis_mesaj_sayisi": 0,
      "toplam_katilimci": 2,
      "created_at": "2025-09-25T16:31:39.387Z",
      "updated_at": "2025-09-25T16:32:15.123Z"
    }
  ],
  "toplam_sohbet": 1
}
```

---

### 4. **Sohbet Detaylarını Getir**
```http
GET /api/sohbet/{sohbet_id}
```

**Response (200):**
```json
{
  "message": "Sohbet detayları başarıyla getirildi.",
  "kullanici": {
    "user_id": "68b068563c5b849b5e8b3fa1",
    "name": "DENİZ AYTEKİN",
    "email": "deniz.aytekin@acibadem.com"
  },
  "sohbet": {
    "sohbet_id": "68d56e6b3450157e947f7a92",
    "sohbet_tipi": null,
    
    "ben": {
      "user_id": "68b068563c5b849b5e8b3fa1",
      "name": "DENİZ AYTEKİN",
      "email": "deniz.aytekin@acibadem.com",
      "role": "katilimci"
    },
    
    "baslatan_user": {
      "user_id": "68b068563c5b849b5e8b3fa1",
      "name": "DENİZ AYTEKİN",
      "email": "deniz.aytekin@acibadem.com",
      "role": "baslatan"
    },
    
    "sohbet_ettigi_kisiler": [
      {
        "user_id": "68c1234567890abcdef12345",
        "name": "AHMET YILMAZ",
        "email": "ahmet.yilmaz@acibadem.com",
        "joined_at": "2025-09-25T16:31:39.387Z",
        "role": "katilimci"
      }
    ],
    
    "tum_katilimcilar": [
      {
        "user_id": "68b068563c5b849b5e8b3fa1",
        "name": "DENİZ AYTEKİN",
        "email": "deniz.aytekin@acibadem.com",
        "joined_at": "2025-09-25T16:31:39.387Z",
        "role": "baslatan"
      },
      {
        "user_id": "68c1234567890abcdef12345",
        "name": "AHMET YILMAZ",
        "email": "ahmet.yilmaz@acibadem.com",
        "joined_at": "2025-09-25T16:31:39.387Z",
        "role": "katilimci"
      }
    ],
    
    "son_mesaj": {
      "mesaj_id": "68d56e6b3450157e947f7a96",
      "message": "Merhaba!",
      "time": "2025-09-25T16:32:15.123Z",
      "sender": {
        "user_id": "68b068563c5b849b5e8b3fa1",
        "name": "DENİZ AYTEKİN"
      }
    },
    
    "okunmamis_mesaj_sayisi": 0,
    "toplam_katilimci": 2,
    "created_at": "2025-09-25T16:31:39.387Z",
    "updated_at": "2025-09-25T16:32:15.123Z"
  }
}
```

---

### 5. **Sohbet Mesajlarını Getir**
```http
GET /api/sohbet/{sohbet_id}/mesajlar
```

**Response (200):**
```json
{
  "message": "Mesajlar başarıyla getirildi.",
  "sohbet": {
    "sohbet_id": "64a1b2c3d4e5f6789012346",
    "sohbet_tipi": "genel",
    "baslatan_user": {
      "user_id": "64a1b2c3d4e5f6789012347",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com"
    },
    "katilimcilar": [
      {
        "user_id": "64a1b2c3d4e5f6789012347",
        "name": "Ahmet Yılmaz",
        "email": "ahmet@example.com",
        "joined_at": "2024-01-15T10:30:00.000Z"
      },
      {
        "user_id": "64a1b2c3d4e5f6789012345",
        "name": "Mehmet Kaya",
        "email": "mehmet@example.com",
        "joined_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  },
  "mesajlar": [
    {
      "mesaj_id": "64a1b2c3d4e5f6789012348",
      "message": "Merhaba, nasılsın?",
      "time": "2024-01-15T10:35:00.000Z",
      "okunma_tarihi": "2024-01-15T10:36:00.000Z",
      "sender": {
        "user_id": "64a1b2c3d4e5f6789012347",
        "name": "Ahmet Yılmaz",
        "email": "ahmet@example.com"
      }
    },
    {
      "mesaj_id": "64a1b2c3d4e5f6789012349",
      "message": "İyiyim, teşekkürler!",
      "time": "2024-01-15T10:36:00.000Z",
      "okunma_tarihi": null,
      "sender": {
        "user_id": "64a1b2c3d4e5f6789012345",
        "name": "Mehmet Kaya",
        "email": "mehmet@example.com"
      }
    }
  ],
  "toplam_mesaj": 2
}
```

---

## 🔒 Güvenlik Özellikleri

### ✅ Yetkilendirme Kontrolleri
- Kullanıcı sadece katıldığı sohbetlere erişebilir
- Mesaj gönderme yetkisi kontrol edilir
- Sohbet detaylarına erişim kontrol edilir

### ✅ Input Validation
- ObjectId format kontrolü
- Mesaj uzunluk kontrolü (1-1000 karakter)
- Zorunlu alan kontrolü

### ✅ Otomatik Okundu İşaretleme
- Mesajlar getirildiğinde otomatik okundu olarak işaretlenir
- Kendi mesajları okundu olarak işaretlenmez

---

## 📊 Veri Yapısı

### Sohbet Katılımcıları
Her sohbet için katılımcıların tam bilgileri döndürülür:
- `user_id`: Kullanıcı ID'si
- `name`: Kullanıcı adı
- `email`: Kullanıcı e-postası
- `joined_at`: Katılım tarihi

### Mesaj Gönderen Bilgileri
Her mesaj için gönderenin tam bilgileri:
- `user_id`: Gönderen ID'si
- `name`: Gönderen adı
- `email`: Gönderen e-postası

### Sohbet Başlatan Bilgileri
Sohbeti başlatan kullanıcının bilgileri:
- `user_id`: Başlatan ID'si
- `name`: Başlatan adı
- `email`: Başlatan e-postası

---

## 🚨 Hata Durumları

### 400 - Bad Request
```json
{
  "error": "Validation Error",
  "message": "Giriş verileri geçersiz",
  "details": [
    {
      "field": "hedef_user_id",
      "message": "Geçerli bir ObjectId giriniz",
      "value": "invalid-id"
    }
  ]
}
```

### 403 - Forbidden
```json
{
  "error": "Bu sohbete erişim yetkiniz yok."
}
```

### 404 - Not Found
```json
{
  "error": "Hedef kullanıcı bulunamadı."
}
```

### 500 - Internal Server Error
```json
{
  "error": "Sohbet oluşturulamadı.",
  "details": "Database connection error"
}
```

---

## 🔄 Güncelleme Notları

### v1.2.0 - Gelişmiş Sohbet Yapısı
- ✅ **Login olan kullanıcı bilgileri** (`ben`) eklendi
- ✅ **Sohbet ettiği kişiler** (`sohbet_ettigi_kisiler`) ayrıldı
- ✅ **Tüm katılımcılar** (`tum_katilimcilar`) detaylandırıldı
- ✅ **Role bilgileri** (baslatan/katilimci) eklendi
- ✅ **Toplam katılımcı sayısı** eklendi
- ✅ **Kullanıcı bilgileri** response'a eklendi
- ✅ **Benzersiz sohbet kimliği** korundu

### v1.1.0 - Kullanıcı İsimleri Eklendi
- ✅ Tüm endpoint'lerde kullanıcı isimleri döndürülüyor
- ✅ Katılımcı bilgileri detaylandırıldı
- ✅ Mesaj gönderen bilgileri eklendi
- ✅ Sohbet başlatan bilgileri eklendi
- ✅ Okunmamış mesaj sayısı eklendi
- ✅ Son mesaj bilgisi eklendi
- ✅ Input validation eklendi
- ✅ Güvenlik kontrolleri güçlendirildi
