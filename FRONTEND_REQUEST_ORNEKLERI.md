# 🚀 Frontend Request Örnekleri - Komple Rehber

## 📌 Genel Bilgiler

**Base URL:** `http://localhost:5000/api` veya production URL'iniz

**Authorization:** Tüm isteklerde JWT token gerekli
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 1️⃣ `/api/talepler/aracTalep` - Araç Talepleri (Atama Yapılmamış)

### ✅ Temel İstek (Filtresiz)
```javascript
// Axios
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Fetch
const response = await fetch('http://localhost:5000/api/talepler/aracTalep', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### ✅ Hasta Talepleri (requestType filtresi)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    requestType: 'hasta'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Beklemedeki Talepler (isDurumu filtresi)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    isDurumu: 'Beklemede'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Bugünkü Talepler (Tarih filtresi)
```javascript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı

const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    startDate: today,
    endDate: today
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Bu Hafta (Tarih aralığı)
```javascript
const today = new Date();
const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0]
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Belirli Lokasyon (lokasyon filtresi)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    lokasyon: '507f1f77bcf86cd799439011' // Lokasyon ObjectId
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Belirli Şoför (sofor filtresi)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    sofor: '507f1f77bcf86cd799439012' // Şoför ObjectId
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Pagination (2. sayfa, 10 kayıt)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    page: 2,
    limit: 10
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 🔥 TÜM FİLTRELER BİRLİKTE (Komple Örnek)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracTalep', {
  params: {
    requestType: 'hasta',           // Sadece hasta talepleri
    isDurumu: 'Beklemede',          // Sadece bekleyenler
    startDate: '2025-01-01',        // Başlangıç tarihi
    endDate: '2025-01-31',          // Bitiş tarihi
    lokasyon: '507f1f77bcf86cd799439011', // Belirli lokasyon
    sofor: '507f1f77bcf86cd799439012',    // Belirli şoför
    page: 1,                        // 1. sayfa
    limit: 20                       // Sayfa başına 20 kayıt
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Response
console.log(response.data);
/*
{
  page: 1,
  limit: 20,
  total: 45,
  items: [
    {
      _id: "67...",
      requestType: "hasta",
      isDurumu: "Beklemede",
      transferTarihi: "2025-01-15T00:00:00.000Z",
      lokasyon: { _id: "...", ad: "İstanbul" },
      sofor: { _id: "...", name: "Ahmet Yılmaz" },
      detay: {
        routes: [...],
        companions: [...]
      },
      nereden: "Acıbadem Hastanesi",
      nereye: "Hilton Otel",
      kisiSayisi: 2,
      tarihSaat: "15.01.2025 14:30"
    }
  ],
  filters: {
    startDate: "2025-01-01",
    endDate: "2025-01-31",
    isDurumu: "Beklemede",
    requestType: "hasta",
    lokasyon: "507f1f77bcf86cd799439011"
  }
}
*/
```

---

## 2️⃣ `/api/talepler/taleplerim` - Benim Taleplerim (Aktif)

### ✅ Temel İstek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/taleplerim', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ İşlemdeki Taleplerim
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/taleplerim', {
  params: {
    isDurumu: 'İşlemde'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Bu Ayki Personel Taleplerim
```javascript
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

const response = await axios.get('http://localhost:5000/api/talepler/taleplerim', {
  params: {
    requestType: 'personel',
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0],
    page: 1,
    limit: 50
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 🔥 Komple Örnek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/taleplerim', {
  params: {
    requestType: 'misafir',         // Tip filtresi
    isDurumu: 'Beklemede',          // Durum filtresi
    startDate: '2025-01-01',        // Tarih başlangıç
    endDate: '2025-01-31',          // Tarih bitiş
    lokasyon: '507f1f77bcf86cd799439011', // Lokasyon
    page: 1,
    limit: 20
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 3️⃣ `/api/talepler/gecmisTaleplerim` - Geçmiş Taleplerim ⭐ YENİ

### ✅ Temel İstek (Tüm geçmiş talepler)
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/gecmisTaleplerim', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Geçen Ayki Taleplerim
```javascript
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

const response = await axios.get('http://localhost:5000/api/talepler/gecmisTaleplerim', {
  params: {
    startDate: startOfLastMonth.toISOString().split('T')[0],
    endDate: endOfLastMonth.toISOString().split('T')[0]
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ 2024 Yılının Tamamlanmış İşleri
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/gecmisTaleplerim', {
  params: {
    isDurumu: 'Tamamlandı',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    page: 1,
    limit: 100
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 🔥 Komple Örnek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/gecmisTaleplerim', {
  params: {
    requestType: 'hasta',           // Hasta talepleri
    isDurumu: 'Tamamlandı',         // Tamamlananlar
    startDate: '2024-06-01',        // 6 ay öncesi
    endDate: '2024-12-31',          // Yıl sonu
    lokasyon: '507f1f77bcf86cd799439011',
    page: 1,
    limit: 50
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 4️⃣ `/api/talepler/aracIsEmri` - İş Emirleri (Atama Yapılmış)

### ✅ Temel İstek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracIsEmri', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Bugünkü İş Emirleri
```javascript
const today = new Date().toISOString().split('T')[0];

const response = await axios.get('http://localhost:5000/api/talepler/aracIsEmri', {
  params: {
    startDate: today,
    endDate: today
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Belirli Şoförün İşleri
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracIsEmri', {
  params: {
    sofor: '507f1f77bcf86cd799439012',
    isDurumu: 'İşlemde'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 🔥 Komple Örnek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/aracIsEmri', {
  params: {
    requestType: 'hasta',
    isDurumu: 'İşlemde',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    lokasyon: '507f1f77bcf86cd799439011',
    sofor: '507f1f77bcf86cd799439012',
    page: 1,
    limit: 20
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 5️⃣ `/api/talepler/isAtamalarim` - İş Atamalarım

### ✅ Temel İstek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/isAtamalarim', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Beklemedeki Atamalar
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/isAtamalarim', {
  params: {
    isDurumu: 'Beklemede'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 🔥 Komple Örnek
```javascript
const response = await axios.get('http://localhost:5000/api/talepler/isAtamalarim', {
  params: {
    requestType: 'personel',
    isDurumu: 'İşlemde',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    lokasyon: '507f1f77bcf86cd799439011',
    sofor: '507f1f77bcf86cd799439012',
    page: 1,
    limit: 20
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🎯 React Hooks ile Tam Örnek

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Filters {
  requestType?: string;
  isDurumu?: string;
  startDate?: string;
  endDate?: string;
  lokasyon?: string;
  sofor?: string;
  page: number;
  limit: number;
}

function TaleplerimPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    requestType: '',
    isDurumu: '',
    startDate: '',
    endDate: '',
    lokasyon: '',
    page: 1,
    limit: 20
  });

  // Token'ı localStorage'dan al
  const token = localStorage.getItem('token');

  // Veri çekme fonksiyonu
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Boş parametreleri temizle
      const params: any = {};
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof Filters];
        if (value !== '' && value !== undefined) {
          params[key] = value;
        }
      });

      const response = await axios.get(`${API_BASE}/talepler/taleplerim`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setData(response.data);
    } catch (err: any) {
      console.error('Hata:', err);
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme ve filtre değişikliklerinde veri çek
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [filters, token]);

  // Filtre değiştirme
  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Filtre değişince 1. sayfaya dön
    }));
  };

  // Sayfa değiştirme
  const nextPage = () => {
    if (data && data.page * data.limit < data.total) {
      handleFilterChange('page', filters.page + 1);
    }
  };

  const prevPage = () => {
    if (filters.page > 1) {
      handleFilterChange('page', filters.page - 1);
    }
  };

  // Bugünü seç
  const selectToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      startDate: today,
      endDate: today,
      page: 1
    }));
  };

  // Bu haftayı seç
  const selectThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    setFilters(prev => ({
      ...prev,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      page: 1
    }));
  };

  // Bu ayı seç
  const selectThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilters(prev => ({
      ...prev,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      page: 1
    }));
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      requestType: '',
      isDurumu: '',
      startDate: '',
      endDate: '',
      lokasyon: '',
      page: 1,
      limit: 20
    });
  };

  return (
    <div className="taleplerim-page">
      <h1>Benim Taleplerim</h1>

      {/* Hızlı Filtreler */}
      <div className="quick-filters">
        <button onClick={selectToday}>Bugün</button>
        <button onClick={selectThisWeek}>Bu Hafta</button>
        <button onClick={selectThisMonth}>Bu Ay</button>
        <button onClick={clearFilters}>Temizle</button>
      </div>

      {/* Detaylı Filtreler */}
      <div className="filters">
        <select 
          value={filters.requestType}
          onChange={(e) => handleFilterChange('requestType', e.target.value)}
        >
          <option value="">Tüm Tipler</option>
          <option value="hasta">Hasta</option>
          <option value="personel">Personel</option>
          <option value="misafir">Misafir</option>
          <option value="diger">Diğer</option>
        </select>

        <select 
          value={filters.isDurumu}
          onChange={(e) => handleFilterChange('isDurumu', e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          <option value="Beklemede">Beklemede</option>
          <option value="İşlemde">İşlemde</option>
          <option value="Tamamlandı">Tamamlandı</option>
        </select>

        <input 
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Başlangıç"
        />

        <input 
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="Bitiş"
        />
      </div>

      {/* Yükleniyor */}
      {loading && <div className="loading">Yükleniyor...</div>}

      {/* Hata */}
      {error && <div className="error">{error}</div>}

      {/* Veri */}
      {!loading && !error && data && (
        <>
          <div className="data-info">
            <p>Toplam {data.total} kayıt</p>
            <p>Sayfa {data.page} / {Math.ceil(data.total / data.limit)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Tip</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item._id}>
                  <td>{item.requestType}</td>
                  <td>{item.isDurumu}</td>
                  <td>{new Date(item.transferTarihi).toLocaleDateString('tr-TR')}</td>
                  <td>
                    {item.detay?.routes?.length || 0} rota
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={prevPage} disabled={filters.page === 1}>
              ← Önceki
            </button>
            <span>Sayfa {data.page}</span>
            <button 
              onClick={nextPage} 
              disabled={data.page * data.limit >= data.total}
            >
              Sonraki →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TaleplerimPage;
```

---

## 📝 Parametre Özeti

| Parametre | Tip | Zorunlu | Örnek | Açıklama |
|-----------|-----|---------|-------|----------|
| `requestType` | string | ❌ | `"hasta"` | Talep tipi: hasta, personel, misafir, diger |
| `isDurumu` | string | ❌ | `"Beklemede"` | İş durumu: Beklemede, İşlemde, Tamamlandı |
| `startDate` | string | ❌ | `"2025-01-01"` | Başlangıç tarihi (YYYY-MM-DD) |
| `endDate` | string | ❌ | `"2025-01-31"` | Bitiş tarihi (YYYY-MM-DD) |
| `lokasyon` | string | ❌ | `"507f..."` | Lokasyon ObjectId |
| `sofor` | string | ❌ | `"507f..."` | Şoför ObjectId (sadece bazı endpoint'lerde) |
| `page` | number | ❌ | `1` | Sayfa numarası (varsayılan: 1) |
| `limit` | number | ❌ | `20` | Sayfa başına kayıt (varsayılan: 20) |

---

## 🐛 Hata Yönetimi

```javascript
try {
  const response = await axios.get('http://localhost:5000/api/talepler/taleplerim', {
    params: { page: 1 },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Başarılı:', response.data);
  
} catch (error) {
  if (error.response) {
    // Sunucu hatası (4xx, 5xx)
    console.error('Sunucu hatası:', error.response.status);
    console.error('Mesaj:', error.response.data.message);
    
    if (error.response.status === 401) {
      // Token geçersiz, login'e yönlendir
      window.location.href = '/login';
    }
  } else if (error.request) {
    // İstek gönderildi ama cevap yok
    console.error('Sunucuya ulaşılamıyor');
  } else {
    // İstek oluşturulurken hata
    console.error('İstek hatası:', error.message);
  }
}
```

---

## ✅ POSTMAN Collection Örneği

```json
{
  "info": {
    "name": "Talepler API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Araç Talepleri (Tüm Filtreler)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/talepler/aracTalep?requestType=hasta&isDurumu=Beklemede&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20",
          "host": ["{{base_url}}"],
          "path": ["api", "talepler", "aracTalep"],
          "query": [
            {"key": "requestType", "value": "hasta"},
            {"key": "isDurumu", "value": "Beklemede"},
            {"key": "startDate", "value": "2025-01-01"},
            {"key": "endDate", "value": "2025-01-31"},
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "20"}
          ]
        }
      }
    }
  ]
}
```

Hepsi hazır! 🎉 Kopyala-yapıştır yapabilirsin! 🚀

