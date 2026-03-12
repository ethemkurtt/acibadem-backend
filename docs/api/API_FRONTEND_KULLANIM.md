# 📱 Frontend API Kullanım Rehberi

## 🚀 Güncellenmiş Endpoint'ler

Tüm endpoint'ler artık **gelişmiş filtreleme**, **pagination** ve **geçmiş tarih kontrolü** desteklemektedir.

---

## 📋 Endpoint Listesi

### 1. **`GET /api/talepler/aracTalep`** *(Araç Talepleri)*
**Açıklama:** Atama yapılmamış, aktif araç taleplerini listeler (geçmiş tarihli olanlar GELmez).

**Parametreler:**
```javascript
{
  requestType: string,    // Opsiyonel: "hasta", "personel", "misafir", "diger"
  isDurumu: string,       // Opsiyonel: "Beklemede", "İşlemde", "Tamamlandı"
  startDate: string,      // Opsiyonel: YYYY-MM-DD formatında
  endDate: string,        // Opsiyonel: YYYY-MM-DD formatında
  lokasyon: string,       // Opsiyonel: Lokasyon ObjectId
  sofor: string,          // Opsiyonel: Şoför ObjectId
  page: number,           // Varsayılan: 1
  limit: number           // Varsayılan: 20
}
```

**Örnek İstek:**
```javascript
const response = await axios.get('/api/talepler/aracTalep', {
  params: {
    requestType: 'hasta',
    isDurumu: 'Beklemede',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    page: 1,
    limit: 20
  },
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

**Response:**
```javascript
{
  page: 1,
  limit: 20,
  total: 45,
  items: [
    {
      _id: "...",
      requestType: "hasta",
      isDurumu: "Beklemede",
      transferTarihi: "2025-01-15",
      detay: {
        routes: [...],
        companions: [...]
      },
      nereden: "Hastane A",
      nereye: "Otel B",
      kisiSayisi: 2,
      tarihSaat: "15.01.2025 14:30"
    }
  ],
  filters: {
    startDate: "2025-01-01",
    endDate: "2025-01-31",
    isDurumu: "Beklemede",
    requestType: "hasta",
    lokasyon: null
  }
}
```

---

### 2. **`GET /api/talepler/taleplerim`** *(Benim Taleplerim)*
**Açıklama:** Giriş yapan kullanıcının oluşturduğu talepler (geçmiş tarihli olanlar GELmez).

**Parametreler:**
```javascript
{
  requestType: string,    // Opsiyonel
  isDurumu: string,       // Opsiyonel
  startDate: string,      // Opsiyonel
  endDate: string,        // Opsiyonel
  lokasyon: string,       // Opsiyonel
  page: number,           // Varsayılan: 1
  limit: number           // Varsayılan: 20
}
```

**Örnek İstek:**
```javascript
const response = await axios.get('/api/talepler/taleplerim', {
  params: {
    isDurumu: 'İşlemde',
    page: 1,
    limit: 10
  },
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

### 3. **`GET /api/talepler/gecmisTaleplerim`** ⭐ *(YENİ: Geçmiş Taleplerim)*
**Açıklama:** Giriş yapan kullanıcının **geçmiş tarihli** talepleri (sadece bitiş tarihi bugünden önceki olanlar).

**Parametreler:**
```javascript
{
  requestType: string,    // Opsiyonel
  isDurumu: string,       // Opsiyonel
  startDate: string,      // Opsiyonel
  endDate: string,        // Opsiyonel
  lokasyon: string,       // Opsiyonel
  page: number,           // Varsayılan: 1
  limit: number           // Varsayılan: 20
}
```

**Örnek İstek:**
```javascript
const response = await axios.get('/api/talepler/gecmisTaleplerim', {
  params: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    page: 1,
    limit: 20
  },
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

**Response:**
```javascript
{
  page: 1,
  limit: 20,
  total: 120,  // Geçmiş toplam kayıt sayısı
  items: [
    {
      _id: "...",
      requestType: "hasta",
      isDurumu: "Tamamlandı",
      transferTarihi: "2024-12-25",
      detay: {
        routes: [...],
        companions: [...]
      }
    }
  ],
  filters: {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isDurumu: null,
    requestType: null,
    lokasyon: null
  }
}
```

---

### 4. **`GET /api/talepler/aracIsEmri`** *(İş Emirleri)*
**Açıklama:** Atama yapılmış iş emirlerini listeler (geçmiş tarihli olanlar GELmez).

**Parametreler:**
```javascript
{
  requestType: string,
  isDurumu: string,
  startDate: string,
  endDate: string,
  lokasyon: string,
  sofor: string,
  page: number,
  limit: number
}
```

---

### 5. **`GET /api/talepler/isAtamalarim`** *(İş Atamalarım)*
**Açıklama:** Atama yapılmış işleri listeler (geçmiş tarihli olanlar GELmez).

**Parametreler:**
```javascript
{
  requestType: string,
  isDurumu: string,
  startDate: string,
  endDate: string,
  lokasyon: string,
  sofor: string,
  page: number,
  limit: number
}
```

---

## 🔥 Tarih Filtreleme Mantığı

### ✅ Aktif İşler (aracTalep, taleplerim, aracIsEmri, isAtamalarim)
- **Kural:** `end >= BUGÜN` (routes'daki son drop date >= bugünün 00:00'ı)
- **Sonuç:** Bugün ve gelecekteki işler listelenir
- **Geçmiş işler:** GELmez ❌

### ✅ Geçmiş İşler (gecmisTaleplerim)
- **Kural:** `end < BUGÜN` (routes'daki son drop date < bugünün 00:00'ı)
- **Sonuç:** Sadece dün ve önceki işler listelenir
- **Aktif/gelecek işler:** GELmez ❌

---

## 📊 Örnek Kullanım Senaryoları

### Senaryo 1: Bugünkü Hasta Taleplerini Listele
```javascript
const response = await axios.get('/api/talepler/aracTalep', {
  params: {
    requestType: 'hasta',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

### Senaryo 2: Bu Ayki Bekleyen Taleplerim
```javascript
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

const response = await axios.get('/api/talepler/taleplerim', {
  params: {
    isDurumu: 'Beklemede',
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0],
    page: 1,
    limit: 50
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

### Senaryo 3: Geçen Yılın Tamamlanmış İşleri
```javascript
const response = await axios.get('/api/talepler/gecmisTaleplerim', {
  params: {
    isDurumu: 'Tamamlandı',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    page: 1,
    limit: 100
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

### Senaryo 4: İstanbul Lokasyonundaki Aktif İş Emirleri
```javascript
const response = await axios.get('/api/talepler/aracIsEmri', {
  params: {
    lokasyon: '507f1f77bcf86cd799439011', // İstanbul lokasyon ID
    isDurumu: 'İşlemde',
    page: 1,
    limit: 20
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## ⚡ Performans Notları

- **Cache:** Otel, Hastane, Havalimanı, Lokasyon, Bölge, Ülke verileri Redis'ten cache'lenir
- **Batch Query:** N+1 sorgu problemi çözüldü, tüm detaylar batch olarak çekilir
- **Pagination:** Büyük data setleri için sayfalama kullanın
- **Tarih Filtresi:** Gereksiz kayıtları filtrelemek için tarih aralığı kullanın

---

## 🎯 İş Durumları (isDurumu)

Sistemde kullanılabilecek iş durumları:
- `Beklemede`
- `İşlemde`
- `Tamamlandı`
- `İptal Edildi` (varsa)

---

## 🔑 Authentication

Tüm endpoint'ler **JWT token** gerektirir:

```javascript
headers: {
  Authorization: `Bearer ${yourJWTToken}`
}
```

Token yoksa veya geçersizse `401 Unauthorized` hatası döner.

---

## 📝 Response Yapısı

Tüm endpoint'ler aynı yapıyı döner:

```typescript
interface Response {
  page: number;
  limit: number;
  total: number;
  items: Array<TalepItem>;
  filters: {
    startDate: string | null;
    endDate: string | null;
    isDurumu: string | null;
    requestType: string | null;
    lokasyon: string | null;
  };
}

interface TalepItem {
  _id: string;
  requestType: string;
  isDurumu: string;
  transferTarihi: string;
  lokasyon: Object;
  sofor: Object;
  detay: {
    routes: Array<Route>;
    companions: Array<Companion>;
    // ... diğer alanlar
  };
  // ... diğer alanlar
}
```

---

## 🐛 Hata Yönetimi

```javascript
try {
  const response = await axios.get('/api/talepler/taleplerim', {
    params: { page: 1 },
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Sunucu hatası
    console.error('Hata:', error.response.data.message);
  } else {
    // Network hatası
    console.error('Bağlantı hatası:', error.message);
  }
}
```

---

## 📞 İletişim

Sorularınız için: backend@acibadem.com

