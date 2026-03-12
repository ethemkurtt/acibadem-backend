# Talep Servisleri API Dökümanı

Bu döküman, Acibadem Backend sistemindeki hastaTalep, misafirTalep, digerTalep ve otelTalep servislerinin API endpoint'lerini detaylı olarak açıklamaktadır.

## İçindekiler

1. [Hasta Talep Servisi](#hasta-talep-servisi)
2. [Misafir Talep Servisi](#misafir-talep-servisi)
3. [Diğer Talep Servisi](#diğer-talep-servisi)
4. [Otel Talep Servisi](#otel-talep-servisi)

---

## Hasta Talep Servisi

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

**Açıklama:** Tüm hasta taleplerini listeler.

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

**Açıklama:** Belirtilen ID'ye sahip hasta talebini getirir.

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

**Açıklama:** Atama bekleyen talepleri listeler. Kullanıcının lokasyonuna göre filtrelenir.

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

**Açıklama:** Atama yapılmış talepleri listeler.

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

**Açıklama:** Giriş yapan kullanıcının oluşturduğu talepleri listeler.

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

**Açıklama:** Giriş yapan şoförün atamalarını listeler.

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

**Açıklama:** Belirtilen şoförün atamalarını listeler.

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

**Açıklama:** Mevcut hasta talebini günceller.

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

**Açıklama:** Talebe araç ve şoför atar.

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

**Açıklama:** Talebi başlatır.

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

**Açıklama:** Talebi tamamlar.

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

**Açıklama:** Talebi iptal eder.

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

**Açıklama:** Talebin lokasyonunu günceller.

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

**Açıklama:** UETDS sefer referans numarasını günceller.

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

**Açıklama:** Hasta talebini ve ilişkili verileri siler.

**Response:** `200 OK`
```json
{
  "message": "Talep ve ilişkili veriler silindi"
}
```

---

## Misafir Talep Servisi

### Base URL
```
/api/misafir-talep
```

### Endpoint'ler

#### 1. Yeni Misafir Talep Oluştur
**POST** `/api/misafir-talep`

**Açıklama:** Yeni bir misafir transfer talebi oluşturur.

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

**Açıklama:** Tüm misafir taleplerini listeler.

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

**Açıklama:** Belirtilen ID'ye sahip misafir talebini getirir.

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

**Açıklama:** Mevcut misafir talebini günceller.

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

**Açıklama:** Misafir talebini ve ilişkili verileri siler.

**Response:** `200 OK`
```json
{
  "message": "Talep ve ilişkili veriler silindi"
}
```

---

## Diğer Talep Servisi

### Base URL
```
/api/diger-talep
```

### Endpoint'ler

#### 1. Yeni Diğer Talep Oluştur
**POST** `/api/diger-talep`

**Açıklama:** Yeni bir diğer talep oluşturur.

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

**Açıklama:** Tüm diğer talepleri listeler. Sayfalama ve arama desteği vardır.

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

**Açıklama:** Belirtilen ID'ye sahip diğer talebi getirir.

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

**Açıklama:** Mevcut diğer talebi günceller.

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

**Açıklama:** Diğer talebi siler.

**Response:** `200 OK`
```json
{
  "message": "Silindi"
}
```

#### 6. Tüm Diğer Talepleri Sil
**DELETE** `/api/diger-talep`

**Açıklama:** Tüm diğer talepleri siler.

**Response:** `200 OK`
```json
{
  "message": "Tüm kayıtlar silindi",
  "deleted": 150
}
```

---

## Otel Talep Servisi

### Base URL
```
/api/otel-talep
```

### Endpoint'ler

#### 1. Yeni Otel Talep Oluştur
**POST** `/api/otel-talep`

**Açıklama:** Yeni bir otel konaklama talebi oluşturur.

**Request Body:**
```json
{
  "adSoyad": "Ahmet Yılmaz",
  "tc": "12345678901",
  "telefon": "05551234567",
  "email": "ahmet@example.com",
  "odemeTipi": "Kredi Kartı",
  "faturaBilgisi": "Kurumsal",
  "sube": "İstanbul",
  "masrafMerkezi": "Merkez",
  "konaklamaTuru": "otel",
  "otelId": "ObjectId",
  "odaSayisi": 2,
  "odaTipi": "ObjectId",
  "rezidansTipi": null,
  "yemekTalebi": "Kahvaltı dahil",
  "yemekOgunu": "Sabah",
  "girisTarihi": "2024-01-15T14:00:00Z",
  "cikisTarihi": "2024-01-17T11:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "_id": "ObjectId",
  "adSoyad": "Ahmet Yılmaz",
  "tc": "12345678901",
  "telefon": "05551234567",
  "email": "ahmet@example.com",
  "odemeTipi": "Kredi Kartı",
  "faturaBilgisi": "Kurumsal",
  "sube": "İstanbul",
  "masrafMerkezi": "Merkez",
  "konaklamaTuru": "otel",
  "otelId": "ObjectId",
  "odaSayisi": 2,
  "odaTipi": "ObjectId",
  "rezidansTipi": null,
  "yemekTalebi": "Kahvaltı dahil",
  "yemekOgunu": "Sabah",
  "girisTarihi": "2024-01-15T14:00:00Z",
  "cikisTarihi": "2024-01-17T11:00:00Z",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 2. Tüm Otel Taleplerini Listele
**GET** `/api/otel-talep`

**Açıklama:** Tüm otel taleplerini listeler.

**Response:** `200 OK`
```json
[
  {
    "_id": "ObjectId",
    "adSoyad": "Ahmet Yılmaz",
    "tc": "12345678901",
    "telefon": "05551234567",
    "email": "ahmet@example.com",
    "odemeTipi": "Kredi Kartı",
    "faturaBilgisi": "Kurumsal",
    "sube": "İstanbul",
    "masrafMerkezi": "Merkez",
    "konaklamaTuru": "otel",
    "otelId": {
      "_id": "ObjectId",
      "otelAdi": "Grand Hotel"
    },
    "odaSayisi": 2,
    "odaTipi": {
      "_id": "ObjectId",
      "kategori": "Deluxe"
    },
    "rezidansTipi": null,
    "yemekTalebi": "Kahvaltı dahil",
    "yemekOgunu": "Sabah",
    "girisTarihi": "2024-01-15T14:00:00Z",
    "cikisTarihi": "2024-01-17T11:00:00Z",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
]
```

#### 3. ID ile Otel Talep Getir
**GET** `/api/otel-talep/:id`

**Açıklama:** Belirtilen ID'ye sahip otel talebini getirir.

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "adSoyad": "Ahmet Yılmaz",
  "tc": "12345678901",
  "telefon": "05551234567",
  "email": "ahmet@example.com",
  "odemeTipi": "Kredi Kartı",
  "faturaBilgisi": "Kurumsal",
  "sube": "İstanbul",
  "masrafMerkezi": "Merkez",
  "konaklamaTuru": "otel",
  "otelId": {
      "_id": "ObjectId",
      "otelAdi": "Grand Hotel"
    },
    "odaSayisi": 2,
    "odaTipi": {
      "_id": "ObjectId",
      "kategori": "Deluxe"
    },
    "rezidansTipi": null,
    "yemekTalebi": "Kahvaltı dahil",
    "yemekOgunu": "Sabah",
    "girisTarihi": "2024-01-15T14:00:00Z",
    "cikisTarihi": "2024-01-17T11:00:00Z",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
}
```

#### 4. Otel Talep Güncelle
**PUT** `/api/otel-talep/:id`

**Açıklama:** Mevcut otel talebini günceller.

**Request Body:** (POST ile aynı format)

**Response:** `200 OK`
```json
{
  "_id": "ObjectId",
  "adSoyad": "Ahmet Yılmaz",
  "tc": "12345678901",
  "telefon": "05551234567",
  "email": "ahmet@example.com",
  "odemeTipi": "Kredi Kartı",
  "faturaBilgisi": "Kurumsal",
  "sube": "İstanbul",
  "masrafMerkezi": "Merkez",
  "konaklamaTuru": "otel",
  "otelId": "ObjectId",
  "odaSayisi": 2,
  "odaTipi": "ObjectId",
  "rezidansTipi": null,
  "yemekTalebi": "Kahvaltı dahil",
  "yemekOgunu": "Sabah",
  "girisTarihi": "2024-01-15T14:00:00Z",
  "cikisTarihi": "2024-01-17T11:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

#### 5. Otel Talep Sil
**DELETE** `/api/otel-talep/:id`

**Açıklama:** Otel talebini siler.

**Response:** `200 OK`
```json
{
  "message": "Talep silindi"
}
```

---

## Hata Kodları

### Genel Hata Kodları
- `400 Bad Request`: Geçersiz istek verisi
- `401 Unauthorized`: Yetkilendirme hatası
- `404 Not Found`: Kayıt bulunamadı
- `500 Internal Server Error`: Sunucu hatası

### Özel Hata Mesajları

#### Hasta Talep Servisi
- `"Talebi oluşturan kullanıcı bilgisi eksik (talepEdenId / talepEdenAdSoyad)."`
- `"talepEdenId geçerli bir ObjectId değil."`
- `"transferTarihi eksik: en az bir güzergah için pickup tarih/saat seçilmelidir."`
- `"transferTarihi/transferTipi zorunludur ve geçerli olmalıdır."`
- `"Kullanıcının lokasyon bilgisi eksik."`
- `"Tamamlanmış iş yeniden başlatılamaz."`
- `"İş tamamlanmadan önce başlatılmalıdır."`
- `"Tamamlanmış iş iptal edilemez."`

#### Misafir Talep Servisi
- `"fullName, passportNo, phone ve lokasyon zorunludur."`

#### Diğer Talep Servisi
- `"Kayıt bulunamadı"`
- `"Geçersiz ID"`

#### Otel Talep Servisi
- `"Talep bulunamadı"`

---

## Notlar

1. **Kimlik Doğrulama**: Bazı endpoint'ler `Authorization` header'ı gerektirir.
2. **ObjectId**: MongoDB ObjectId formatında referanslar kullanılır.
3. **Tarih Formatları**: ISO 8601 formatında tarih/saat bilgileri kullanılır.
4. **Populate**: İlişkili veriler otomatik olarak populate edilir.
5. **Sayfalama**: Diğer talep servisinde sayfalama desteği vardır.
6. **Arama**: Diğer talep servisinde metin tabanlı arama desteği vardır.
7. **Dosya Yükleme**: Hasta talep servisinde dosya yükleme desteği vardır (multer ile).

---

*Bu döküman Acibadem Backend API'sinin talep servisleri için hazırlanmıştır. Güncel bilgiler için sistem yöneticisi ile iletişime geçiniz.*
