# Acibadem Backend API Dökümanı

Bu döküman, Acibadem Backend sistemindeki tüm servislerin API endpoint'lerini detaylı olarak açıklamaktadır.

## İçindekiler

1. [Kimlik Doğrulama Servisi](#kimlik-doğrulama-servisi)
2. [Kullanıcı Yönetimi Servisi](#kullanıcı-yönetimi-servisi)
3. [Rol ve Yetki Yönetimi](#rol-ve-yetki-yönetimi)
4. [Talep Servisleri](#talep-servisleri)
5. [Seyahat Servisleri](#seyahat-servisleri)
6. [Konaklama Servisleri](#konaklama-servisleri)
7. [İletişim Servisleri](#iletişim-servisleri)
8. [Takvim Servisi](#takvim-servisi)
9. [Araç Yönetimi](#araç-yönetimi)
10. [Lokasyon ve Adres Servisleri](#lokasyon-ve-adres-servisleri)
11. [Diğer Servisler](#diğer-servisler)

---

## Kimlik Doğrulama Servisi

### Base URL
```
/api/auth
```

### Endpoint'ler

#### 1. Giriş Yap
**POST** `/api/auth/login`

**Açıklama:** Kullanıcı girişi yapar ve JWT token döner.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Giriş başarılı.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin",
  "access": [1, 2, 3, 4, 5],
  "perms": ["read", "write", "delete"],
  "roles": ["admin", "user"],
  "permissions": {
    "dashboard": ["read", "write"],
    "users": ["read", "write", "delete"]
  },
  "user": {
    "id": "ObjectId",
    "name": "Ahmet Yılmaz",
    "email": "user@example.com",
    "role": "admin",
    "roleGroupId": "ObjectId",
    "tc": "12345678901",
    "telefon": "05551234567",
    "mail": "user@example.com",
    "dogumTarihi": "1990-01-01",
    "cinsiyet": "Erkek",
    "ehliyet": true,
    "departman": "ObjectId",
    "departmanName": "IT",
    "bolge": "ObjectId",
    "bolgeName": "İstanbul",
    "ulke": "ObjectId",
    "ulkeName": "Türkiye",
    "lokasyon": "ObjectId",
    "lokasyonName": "Merkez",
    "lokasyonlar": ["ObjectId1", "ObjectId2"],
    "lokasyonlarNames": ["Merkez", "Şube"]
  }
}
```

#### 2. Kullanıcı Bilgilerini Getir
**GET** `/api/auth/me`

**Açıklama:** Giriş yapan kullanıcının bilgilerini getirir.

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Response:** `200 OK`
```json
{
  "user": {
    "id": "ObjectId",
    "name": "Ahmet Yılmaz",
    "email": "user@example.com",
    "role": "admin",
    "access": [1, 2, 3, 4, 5],
    "roles": ["admin", "user"],
    "perms": ["read", "write", "delete"],
    "permissions": {
      "dashboard": ["read", "write"],
      "users": ["read", "write", "delete"]
    },
    "tc": "12345678901",
    "telefon": "05551234567",
    "mail": "user@example.com",
    "dogumTarihi": "1990-01-01",
    "cinsiyet": "Erkek",
    "ehliyet": true,
    "departman": "ObjectId",
    "departmanName": "IT",
    "lokasyon": "ObjectId",
    "lokasyonName": "Merkez",
    "bolge": "ObjectId",
    "bolgeName": "İstanbul",
    "ulke": "ObjectId",
    "ulkeName": "Türkiye"
  },
  "role": "admin",
  "access": [1, 2, 3, 4, 5],
  "perms": ["read", "write", "delete"],
  "roles": ["admin", "user"],
  "permissions": {
    "dashboard": ["read", "write"],
    "users": ["read", "write", "delete"]
  }
}
```

#### 3. Şifre Sıfırlama İsteği
**POST** `/api/auth/forgot-password`

**Açıklama:** Şifre sıfırlama e-postası gönderir.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Eğer e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi."
}
```

#### 4. Şifre Sıfırlama Token Doğrula
**GET** `/api/auth/verify-reset-token`

**Açıklama:** Şifre sıfırlama token'ının geçerliliğini kontrol eder.

**Query Parameters:**
- `token` (zorunlu): Sıfırlama token'ı

**Response:** `200 OK`
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

#### 5. Şifre Sıfırla
**POST** `/api/auth/reset-password`

**Açıklama:** Yeni şifre belirler.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Şifre başarıyla güncellendi. Giriş yapabilirsiniz."
}
```

---

## Kullanıcı Yönetimi Servisi

### Base URL
```
/api/users
```

### Endpoint'ler

#### 1. Yeni Kullanıcı Oluştur
**POST** `/api/users`

**Açıklama:** Yeni kullanıcı oluşturur.

**Request Body:**
```json
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "password123",
  "organizasyon": "Acibadem",
  "personelGrubu": "Personel",
  "roleGroupId": "ObjectId",
  "tc": "12345678901",
  "departman": "ObjectId",
  "lokasyonlar": ["ObjectId1", "ObjectId2"],
  "lokasyon": "ObjectId",
  "bolge": "ObjectId",
  "ulke": "ObjectId",
  "telefon": "05551234567",
  "mail": "ahmet@example.com",
  "dogumTarihi": "1990-01-01",
  "cinsiyet": "Erkek",
  "ehliyet": true,
  "permissions": {
    "dashboard": ["read", "write"],
    "users": ["read"]
  },
  "perms": ["read", "write"]
}
```

**Response:** `201 Created`
```json
{
  "message": "Kullanıcı oluşturuldu.",
  "user": {
    "id": "ObjectId",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "organizasyon": "Acibadem",
    "personelGrubu": "Personel",
    "roleGroupId": "ObjectId",
    "roleGroupName": "Admin",
    "tc": "12345678901",
    "telefon": "05551234567",
    "mail": "ahmet@example.com",
    "dogumTarihi": "1990-01-01",
    "cinsiyet": "Erkek",
    "ehliyet": true,
    "departman": "ObjectId",
    "departmanName": "IT",
    "lokasyonlar": ["ObjectId1", "ObjectId2"],
    "lokasyonlarNames": ["Merkez", "Şube"],
    "bolge": "ObjectId",
    "bolgeName": "İstanbul",
    "ulke": "ObjectId",
    "ulkeName": "Türkiye",
    "perms": ["read", "write"],
    "permissions": {
      "dashboard": ["read", "write"],
      "users": ["read"]
    }
  }
}
```

#### 2. Tüm Kullanıcıları Listele
**GET** `/api/users`

**Açıklama:** Tüm kullanıcıları listeler.

**Response:** `200 OK`
```json
[
  {
    "id": "ObjectId",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "organizasyon": "Acibadem",
    "personelGrubu": "Personel",
    "roleGroupId": "ObjectId",
    "roleGroupName": "Admin",
    "tc": "12345678901",
    "telefon": "05551234567",
    "mail": "ahmet@example.com",
    "dogumTarihi": "1990-01-01",
    "cinsiyet": "Erkek",
    "ehliyet": true,
    "departman": "ObjectId",
    "departmanName": "IT",
    "lokasyonlar": ["ObjectId1", "ObjectId2"],
    "lokasyonlarNames": ["Merkez", "Şube"],
    "bolge": "ObjectId",
    "bolgeName": "İstanbul",
    "ulke": "ObjectId",
    "ulkeName": "Türkiye",
    "perms": ["read", "write"],
    "permissions": {
      "dashboard": ["read", "write"],
      "users": ["read"]
    }
  }
]
```

#### 3. ID ile Kullanıcı Getir
**GET** `/api/users/:id`

**Açıklama:** Belirtilen ID'ye sahip kullanıcıyı getirir.

**Response:** `200 OK`
```json
{
  "id": "ObjectId",
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "organizasyon": "Acibadem",
  "personelGrubu": "Personel",
  "roleGroupId": "ObjectId",
  "roleGroupName": "Admin",
  "tc": "12345678901",
  "telefon": "05551234567",
  "mail": "ahmet@example.com",
  "dogumTarihi": "1990-01-01",
  "cinsiyet": "Erkek",
  "ehliyet": true,
  "departman": "ObjectId",
  "departmanName": "IT",
  "lokasyonlar": ["ObjectId1", "ObjectId2"],
  "lokasyonlarNames": ["Merkez", "Şube"],
  "bolge": "ObjectId",
  "bolgeName": "İstanbul",
  "ulke": "ObjectId",
  "ulkeName": "Türkiye",
  "perms": ["read", "write"],
  "permissions": {
    "dashboard": ["read", "write"],
    "users": ["read"]
  }
}
```

#### 4. Kullanıcı Güncelle
**PUT** `/api/users/:id`

**Açıklama:** Mevcut kullanıcıyı günceller.

**Request Body:** (POST ile aynı format, password hariç)

**Response:** `200 OK`
```json
{
  "message": "Güncelleme denemesi tamamlandı",
  "acknowledged": true,
  "matchedCount": 1,
  "modifiedCount": 1,
  "setTried": {
    "name": "Ahmet Yılmaz Güncellendi",
    "telefon": "05559876543"
  },
  "diff": {
    "name": {
      "from": "Ahmet Yılmaz",
      "to": "Ahmet Yılmaz Güncellendi"
    },
    "telefon": {
      "from": "05551234567",
      "to": "05559876543"
    }
  },
  "user": {
    "id": "ObjectId",
    "name": "Ahmet Yılmaz Güncellendi",
    "email": "ahmet@example.com",
    "telefon": "05559876543"
  }
}
```

#### 5. Şoför Listesi
**GET** `/api/users/soforler`

**Açıklama:** Şoför rolündeki kullanıcıları listeler.

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "name": "Mehmet Şoför",
    "telefon": "05551234567",
    "musaitlik": true,
    "lokasyonlar": ["ObjectId1", "ObjectId2"],
    "lokasyonlarNames": ["Merkez", "Şube"]
  }
]
```

---

## Rol ve Yetki Yönetimi

### Base URL
```
/api/roles
```

### Endpoint'ler

#### 1. Rol Oluştur
**POST** `/api/roles`

**Açıklama:** Yeni rol oluşturur.

**Request Body:**
```json
{
  "name": "admin",
  "access": [1, 2, 3, 4, 5]
}
```

**Response:** `201 Created`
```json
{
  "message": "Rol oluşturuldu.",
  "role": {
    "_id": "ObjectId",
    "name": "admin",
    "access": [1, 2, 3, 4, 5],
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

#### 2. Tüm Rolleri Listele
**GET** `/api/roles`

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "name": "admin",
    "access": [1, 2, 3, 4, 5],
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
]
```

#### 3. ID ile Rol Getir
**GET** `/api/roles/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "name": "admin",
  "access": [1, 2, 3, 4, 5],
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Rol Güncelle
**PUT** `/api/roles/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "message": "Rol güncellendi.",
  "role": {
    "_id": "ObjectId",
    "name": "admin",
    "access": [1, 2, 3, 4, 5, 6],
    "updatedAt": "2024-01-15T09:00:00Z"
  }
}
```

#### 5. Rol Sil
**DELETE** `/api/roles/:id`

**Response:** `200 OK`
```json
{
  "message": "Rol silindi."
}
```

### Role Group Servisi

### Base URL
```
/api/role-groups
```

### Endpoint'ler

#### 1. Role Group Oluştur
**POST** `/api/role-groups`

**Request Body:**
```json
{
  "roleId": "admin",
  "roleName": "Admin",
  "yetkiler": {
    "perms": ["read", "write", "delete"],
    "permissions": {
      "dashboard": ["read", "write"],
      "users": ["read", "write", "delete"]
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Role grup oluşturuldu.",
  "roleGroup": {
    "_id": "ObjectId",
    "roleId": "admin",
    "roleName": "Admin",
    "yetkiler": {
      "perms": ["read", "write", "delete"],
      "permissions": {
        "dashboard": ["read", "write"],
        "users": ["read", "write", "delete"]
      }
    },
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

#### 2. Tüm Role Group'ları Listele
**GET** `/api/role-groups`

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "roleId": "admin",
    "roleName": "Admin",
    "yetkiler": {
      "perms": ["read", "write", "delete"],
      "permissions": {
        "dashboard": ["read", "write"],
        "users": ["read", "write", "delete"]
      }
    }
  }
]
```

#### 3. ID ile Role Group Getir
**GET** `/api/role-groups/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "roleId": "admin",
  "roleName": "Admin",
  "yetkiler": {
    "perms": ["read", "write", "delete"],
    "permissions": {
      "dashboard": ["read", "write"],
      "users": ["read", "write", "delete"]
    }
  }
}
```

#### 4. Role Group Güncelle
**PUT** `/api/role-groups/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "message": "Güncellendi.",
  "roleGroup": {
    "_id": "ObjectId",
    "roleId": "admin",
    "roleName": "Admin",
    "yetkiler": {
      "perms": ["read", "write", "delete", "admin"],
      "permissions": {
        "dashboard": ["read", "write"],
        "users": ["read", "write", "delete"],
        "settings": ["read", "write"]
      }
    },
    "updatedAt": "2024-01-15T09:00:00Z"
  }
}
```

#### 5. Role Group Sil
**DELETE** `/api/role-groups/:id`

**Response:** `200 OK`
```json
{
  "message": "Silindi."
}
```

---

## Talep Servisleri

### Hasta Talep Servisi

### Base URL
```
/api/hasta-talep
```

### Endpoint'ler

#### 1. Yeni Hasta Talep Oluştur
**POST** `/api/hasta-talep`

**Açıklama:** Yeni bir hasta transfer talebi oluşturur.

**Request Body:**
```json
{
  "requestType": "hasta",
  "fullName": "Ahmet Yılmaz",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId", 
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Hasta",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 1,
  "bagajSayisi": 2,
  "aciklama": "Transfer açıklaması",
  "talepEdenId": "ObjectId",
  "talepEdenAdSoyad": "Dr. Mehmet Özkan",
  "companions": [
    {
      "adSoyad": "Ayşe Yılmaz",
      "tcPasaport": "98765432109",
      "telefon": "05559876543"
    }
  ],
  "routes": [
    {
      "pickup": {
        "type": "hastane",
        "locationId": "ObjectId",
        "date": "2024-01-15T10:00:00Z",
        "ticket": "TK123",
        "passport": ["12345678901"]
      },
      "drop": {
        "type": "hastane",
        "locationId": "ObjectId", 
        "date": "2024-01-15T18:00:00Z",
        "ticket": "TK124",
        "passport": ["12345678901"]
      }
    }
  ],
  "notificationPerson": {
    "adSoyad": "Dr. Mehmet Özkan",
    "telefon": "05551234567",
    "email": "mehmet@acibadem.com"
  }
}
```

**Response:** `201 Created`
```json
{
  "_id": "ObjectId",
  "requestType": "hasta",
  "fullName": "Ahmet Yılmaz",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Hasta",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 1,
  "bagajSayisi": 2,
  "aciklama": "Transfer açıklaması",
  "talepEdenId": "ObjectId",
  "talepEdenAdSoyad": "Dr. Mehmet Özkan",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "atamaDurumu": "Hayır",
  "talepDurumu": "Bekliyor",
  "isDurumu": "Bekliyor",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 2. Tüm Hasta Taleplerini Listele
**GET** `/api/hasta-talep`

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "passportNo": "12345678901",
    "phone": "05551234567",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "talepDurumu": "Bekliyor",
    "atamaDurumu": "Hayır",
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...},
    "arac": null,
    "sofor": null,
    "lokasyon": {...},
    "talepEdenId": {...}
  }
]
```

#### 3. ID ile Hasta Talep Getir
**GET** `/api/hasta-talep/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "fullName": "Ahmet Yılmaz",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Hasta",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 1,
  "bagajSayisi": 2,
  "aciklama": "Transfer açıklaması",
  "talepEdenId": "ObjectId",
  "talepEdenAdSoyad": "Dr. Mehmet Özkan",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "atamaDurumu": "Hayır",
  "talepDurumu": "Bekliyor",
  "isDurumu": "Bekliyor",
  "bolgeName": "İstanbul",
  "countryName": "Türkiye",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Bekleyen Talepler
**GET** `/api/hasta-talep/bekleyen`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "atamaDurumu": "Hayır",
    "lokasyon": {...},
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...},
    "talepEdenId": {...}
  }
]
```

#### 5. Onaylanmış Talepler
**GET** `/api/hasta-talep/onaylanmis`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "atamaDurumu": "Evet",
    "arac": {...},
    "sofor": {...},
    "lokasyon": {...},
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...},
    "talepEdenId": {...}
  }
]
```

#### 6. Kullanıcının Talepleri
**GET** `/api/hasta-talep/taleplerim`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "talepDurumu": "Bekliyor",
    "atamaDurumu": "Hayır",
    "lokasyon": {...},
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...},
    "arac": null,
    "sofor": null
  }
]
```

#### 7. Şoför Atamalarım
**GET** `/api/hasta-talep/sofor/atamalarim`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Query Parameters:**
- `status` (opsiyonel): Talep durumu filtresi
- `dateFrom` (opsiyonel): Başlangıç tarihi (YYYY-MM-DD)
- `dateTo` (opsiyonel): Bitiş tarihi (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "atamaDurumu": "Evet",
    "isDurumu": "Bekliyor",
    "arac": {...},
    "sofor": {...},
    "lokasyon": {...},
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...}
  }
]
```

#### 8. Belirli Şoförün Atamaları
**GET** `/api/hasta-talep/sofor/:id/atamalar`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Query Parameters:**
- `status` (opsiyonel): Talep durumu filtresi
- `dateFrom` (opsiyonel): Başlangıç tarihi (YYYY-MM-DD)
- `dateTo` (opsiyonel): Bitiş tarihi (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "fullName": "Ahmet Yılmaz",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "atamaDurumu": "Evet",
    "isDurumu": "Bekliyor",
    "arac": {...},
    "sofor": {...},
    "lokasyon": {...},
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...}
  }
]
```

#### 9. Hasta Talep Güncelle
**PUT** `/api/hasta-talep/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "fullName": "Ahmet Yılmaz",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferTipi": "Normal",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

#### 10. Araç ve Şoför Atama
**PUT** `/api/hasta-talep/:id/atama`

**Request Body:**
```json
{
  "soforId": "ObjectId",
  "aracId": "ObjectId"
}
```

**Response:** `200 OK`
```json
{
  "message": "Atama başarılı",
  "talep": {
    "_id": "ObjectId",
    "atamaDurumu": "Evet",
    "sofor": {...},
    "arac": {...},
    "atamaYapanId": "ObjectId",
    "atamaYapanAdSoyad": "Admin User"
  }
}
```

#### 11. Talep Başlat
**PUT** `/api/hasta-talep/:id/baslat`

**Response:** `200 OK`
```json
{
  "message": "İş başlatıldı.",
  "talep": {
    "_id": "ObjectId",
    "isDurumu": "Başladı",
    "isBaslamaZamani": "2024-01-15T10:00:00Z"
  }
}
```

#### 12. Talep Tamamla
**PUT** `/api/hasta-talep/:id/tamamla`

**Response:** `200 OK`
```json
{
  "message": "İş tamamlandı.",
  "talep": {
    "_id": "ObjectId",
    "isDurumu": "Tamamlandı",
    "isBitisZamani": "2024-01-15T18:00:00Z"
  }
}
```

#### 13. Talep İptal Et
**PUT** `/api/hasta-talep/:id/iptal`

**Request Body:**
```json
{
  "neden": "İptal nedeni"
}
```

**Response:** `200 OK`
```json
{
  "message": "İş iptal edildi.",
  "talep": {
    "_id": "ObjectId",
    "talepDurumu": "İptal",
    "iptalZamani": "2024-01-15T11:00:00Z",
    "iptalNedeni": "İptal nedeni"
  }
}
```

#### 14. Lokasyon Güncelle
**PATCH** `/api/hasta-talep/:id/lokasyon`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Request Body:**
```json
{
  "lokasyonId": "ObjectId"
}
```

**Response:** `200 OK`
```json
{
  "message": "Lokasyon güncellendi.",
  "talep": {
    "_id": "ObjectId",
    "lokasyon": {...},
    "lokasyonSonDegistirenId": "ObjectId",
    "lokasyonSonDegistirenAdSoyad": "Admin User",
    "lokasyonSonDegistirmeZamani": "2024-01-15T11:00:00Z",
    "lokasyonDegisiklikleri": [...]
  }
}
```

#### 15. UETDS Sefer Referans No Güncelle
**PATCH** `/api/hasta-talep/:id/uetds`

**Headers:**
- `Authorization: Bearer <token>` (zorunlu)

**Request Body:**
```json
{
  "uetdsSeferReferansNo": "UETDS123456"
}
```

**Response:** `200 OK`
```json
{
  "message": "UETDS Sefer Referans No güncellendi.",
  "talep": {
    "_id": "ObjectId",
    "uetdsSeferReferansNo": "UETDS123456"
  }
}
```

#### 16. Hasta Talep Sil
**DELETE** `/api/hasta-talep/:id`

**Response:** `200 OK`
```json
{
  "message": "Talep ve ilişkili veriler silindi"
}
```

### Misafir Talep Servisi

### Base URL
```
/api/misafir-talep
```

### Endpoint'ler

#### 1. Yeni Misafir Talep Oluştur
**POST** `/api/misafir-talep`

**Request Body:**
```json
{
  "misafir_adSoyad": "John Smith",
  "misafir_tcPasaport": "PASSPORT123456",
  "misafir_gsm": "+905551234567",
  "misafir_bolge": "ObjectId",
  "misafir_ulke": "ObjectId",
  "misafir_language": "English",
  "misafir_sandalye": "Hayır",
  "misafir_lokasyon": "ObjectId",
  "misafir_aciklama": "Misafir transfer açıklaması",
  "misafir_yolcular": [
    {
      "adSoyad": "Jane Smith",
      "tcPasaport": "PASSPORT789012",
      "telefon": "+905559876543"
    }
  ],
  "misafir_routes": [
    {
      "pickup": {
        "type": "havalimani",
        "locationId": "ObjectId",
        "date": "2024-01-15T10:00:00Z",
        "ticket": "TK123",
        "passport": ["PASSPORT123456"]
      },
      "drop": {
        "type": "otel",
        "locationId": "ObjectId",
        "date": "2024-01-15T18:00:00Z",
        "ticket": "TK124",
        "passport": ["PASSPORT123456"]
      }
    }
  ],
  "notificationPerson": {
    "adSoyad": "Dr. Mehmet Özkan",
    "telefon": "05551234567",
    "email": "mehmet@acibadem.com"
  }
}
```

**Response:** `201 Created`
```json
{
  "_id": "ObjectId",
  "requestType": "misafir",
  "fullName": "John Smith",
  "passportNo": "PASSPORT123456",
  "phone": "+905551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "English",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Misafir",
  "aciklama": "Misafir transfer açıklaması",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "atamaDurumu": "Hayır",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 2. Tüm Misafir Taleplerini Listele
**GET** `/api/misafir-talep`

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "requestType": "misafir",
    "fullName": "John Smith",
    "passportNo": "PASSPORT123456",
    "phone": "+905551234567",
    "bolge": "ObjectId",
    "country": "ObjectId",
    "language": "English",
    "wheelchair": "Hayır",
    "lokasyon": "ObjectId",
    "kategori": "Misafir",
    "aciklama": "Misafir transfer açıklaması",
    "companions": [...],
    "routes": [...],
    "notificationPerson": {...},
    "atamaDurumu": "Hayır",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
]
```

#### 3. ID ile Misafir Talep Getir
**GET** `/api/misafir-talep/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "requestType": "misafir",
  "fullName": "John Smith",
  "passportNo": "PASSPORT123456",
  "phone": "+905551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "English",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Misafir",
  "aciklama": "Misafir transfer açıklaması",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "atamaDurumu": "Hayır",
  "bolgeName": "İstanbul",
  "countryName": "Türkiye",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Misafir Talep Güncelle
**PUT** `/api/misafir-talep/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "requestType": "misafir",
  "fullName": "John Smith",
  "passportNo": "PASSPORT123456",
  "phone": "+905551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "English",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Misafir",
  "aciklama": "Güncellenmiş misafir transfer açıklaması",
  "companions": [...],
  "routes": [...],
  "notificationPerson": {...},
  "atamaDurumu": "Hayır",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

#### 5. Misafir Talep Sil
**DELETE** `/api/misafir-talep/:id`

**Response:** `200 OK`
```json
{
  "message": "Talep ve ilişkili veriler silindi"
}
```

### Personel Talep Servisi

### Base URL
```
/api/personel-talep
```

### Endpoint'ler

#### 1. Yeni Personel Talep Oluştur
**POST** `/api/personel-talep`

**Request Body:**
```json
{
  "requestType": "personel",
  "fullName": "Dr. Mehmet Özkan",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Personel",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 0,
  "bagajSayisi": 1,
  "aciklama": "Personel transfer açıklaması",
  "soforDurumu": "Şoförlü",
  "companions": [],
  "routes": [
    {
      "pickup": {
        "type": "hastane",
        "locationId": "ObjectId",
        "date": "2024-01-15T10:00:00Z"
      },
      "drop": {
        "type": "hastane",
        "locationId": "ObjectId",
        "date": "2024-01-15T18:00:00Z"
      }
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "_id": "ObjectId",
  "requestType": "personel",
  "fullName": "Dr. Mehmet Özkan",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Personel",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 0,
  "bagajSayisi": 1,
  "aciklama": "Personel transfer açıklaması",
  "soforDurumu": "Şoförlü",
  "companions": [],
  "routes": [...],
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 2. Tüm Personel Taleplerini Listele
**GET** `/api/personel-talep`

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "requestType": "personel",
    "fullName": "Dr. Mehmet Özkan",
    "passportNo": "12345678901",
    "phone": "05551234567",
    "transferTarihi": "2024-01-15T10:00:00Z",
    "transferTipi": "Normal",
    "soforDurumu": "Şoförlü",
    "companions": [],
    "routes": [...],
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
]
```

#### 3. ID ile Personel Talep Getir
**GET** `/api/personel-talep/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "requestType": "personel",
  "fullName": "Dr. Mehmet Özkan",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "bolge": "ObjectId",
  "country": "ObjectId",
  "language": "Türkçe",
  "wheelchair": "Hayır",
  "lokasyon": "ObjectId",
  "kategori": "Personel",
  "transferTipi": "Normal",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferSaati": "10:00",
  "donusTarihi": "2024-01-15T18:00:00Z",
  "donusSaati": "18:00",
  "refakatciSayisi": 0,
  "bagajSayisi": 1,
  "aciklama": "Personel transfer açıklaması",
  "soforDurumu": "Şoförlü",
  "companions": [],
  "routes": [...],
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Personel Talep Güncelle
**PUT** `/api/personel-talep/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "requestType": "personel",
  "fullName": "Dr. Mehmet Özkan",
  "passportNo": "12345678901",
  "phone": "05551234567",
  "transferTarihi": "2024-01-15T10:00:00Z",
  "transferTipi": "Normal",
  "soforDurumu": "Şoförlü",
  "companions": [],
  "routes": [...],
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

#### 5. Personel Talep Sil
**DELETE** `/api/personel-talep/:id`

**Response:** `200 OK`
```json
{
  "message": "Talep ve ilişkili veriler silindi"
}
```

#### 6. Tüm Personel Taleplerini Temizle
**DELETE** `/api/personel-talep/clear`

**Response:** `200 OK`
```json
{
  "message": "Tüm personel talepleri ve ilişkili veriler silindi"
}
```

### Diğer Talep Servisi

### Base URL
```
/api/diger-talep
```

### Endpoint'ler

#### 1. Yeni Diğer Talep Oluştur
**POST** `/api/diger-talep`

**Request Body:**
```json
{
  "talep_tipi": "Evrak",
  "talep_tipi_diger": "Özel evrak türü",
  "alt_tip": "Banka",
  "alt_tip_diger": "Özel alt tür",
  "talep_aciklama": "Evrak teslimi için transfer",
  "nereden": "Acibadem Hastanesi",
  "nereye": "Garanti Bankası",
  "transfer_tarih": "2024-01-15",
  "transfer_saat": "14:30",
  "type": "diger"
}
```

**Response:** `201 Created`
```json
{
  "_id": "ObjectId",
  "talep_tipi": "Evrak",
  "talep_tipi_diger": "Özel evrak türü",
  "alt_tip": "Banka",
  "alt_tip_diger": "Özel alt tür",
  "talep_aciklama": "Evrak teslimi için transfer",
  "nereden": "Acibadem Hastanesi",
  "nereye": "Garanti Bankası",
  "transfer_tarih": "2024-01-15",
  "transfer_saat": "14:30",
  "type": "diger",
  "atamaDurumu": "Hayır",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 2. Tüm Diğer Talepleri Listele
**GET** `/api/diger-talep`

**Query Parameters:**
- `search` (opsiyonel): Arama terimi
- `page` (opsiyonel): Sayfa numarası (varsayılan: 1)
- `limit` (opsiyonel): Sayfa başına kayıt sayısı (varsayılan: 25, maksimum: 200)
- `sort` (opsiyonel): Sıralama alanı (varsayılan: -createdAt)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "talep_tipi": "Evrak",
      "alt_tip": "Banka",
      "talep_aciklama": "Evrak teslimi için transfer",
      "nereden": "Acibadem Hastanesi",
      "nereye": "Garanti Bankası",
      "transfer_tarih": "2024-01-15",
      "transfer_saat": "14:30",
      "type": "diger",
      "atamaDurumu": "Hayır",
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

#### 3. ID ile Diğer Talep Getir
**GET** `/api/diger-talep/:id`

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "talep_tipi": "Evrak",
  "talep_tipi_diger": "Özel evrak türü",
  "alt_tip": "Banka",
  "alt_tip_diger": "Özel alt tür",
  "talep_aciklama": "Evrak teslimi için transfer",
  "nereden": "Acibadem Hastanesi",
  "nereye": "Garanti Bankası",
  "transfer_tarih": "2024-01-15",
  "transfer_saat": "14:30",
  "type": "diger",
  "atamaDurumu": "Hayır",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Diğer Talep Güncelle
**PUT** `/api/diger-talep/:id`

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "talep_tipi": "Evrak",
  "talep_tipi_diger": "Güncellenmiş evrak türü",
  "alt_tip": "Banka",
  "alt_tip_diger": "Güncellenmiş alt tür",
  "talep_aciklama": "Güncellenmiş evrak teslimi için transfer",
  "nereden": "Acibadem Hastanesi",
  "nereye": "Garanti Bankası",
  "transfer_tarih": "2024-01-15",
  "transfer_saat": "14:30",
  "type": "diger",
  "atamaDurumu": "Hayır",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

#### 5. Diğer Talep Sil
**DELETE** `/api/diger-talep/:id`

**Response:** `200 OK`
```json
{
  "message": "Silindi"
}
```

#### 6. Tüm Diğer Talepleri Sil
**DELETE** `/api/diger-talep`

**Response:** `200 OK`
```json
{
  "message": "Tüm kayıtlar silindi",
  "deleted": 150
}
```

---

*Bu dökümanın devamı bir sonraki bölümde yer almaktadır...*
