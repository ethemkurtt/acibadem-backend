# 🎨 Frontend Developer'a Vereceğiniz Prompt

Merhaba! Backend API'leri güncelledim. İşte kullanabileceğiniz bilgiler:

---

## 🚀 API Özeti

### Endpoint'ler:
1. **`GET /api/talepler/aracTalep`** - Araç talepleri (aktif)
2. **`GET /api/talepler/taleplerim`** - Benim taleplerim (aktif)
3. **`GET /api/talepler/gecmisTaleplerim`** ⭐ **YENİ** - Geçmiş taleplerim
4. **`GET /api/talepler/aracIsEmri`** - İş emirleri (aktif)
5. **`GET /api/talepler/isAtamalarim`** - İş atamalarım (aktif)

### Ortak Parametreler (Query String):
```javascript
{
  requestType: 'hasta' | 'personel' | 'misafir' | 'diger',  // İsteğe bağlı
  isDurumu: 'Beklemede' | 'İşlemde' | 'Tamamlandı',        // İsteğe bağlı
  startDate: 'YYYY-MM-DD',                                   // İsteğe bağlı
  endDate: 'YYYY-MM-DD',                                     // İsteğe bağlı
  lokasyon: 'ObjectId',                                      // İsteğe bağlı
  sofor: 'ObjectId',                                         // İsteğe bağlı (sadece aracTalep, aracIsEmri, isAtamalarim)
  page: 1,                                                   // Varsayılan: 1
  limit: 20                                                  // Varsayılan: 20
}
```

### Response Yapısı:
```typescript
{
  page: number,
  limit: number,
  total: number,
  items: Array<TalepItem>,
  filters: {
    startDate: string | null,
    endDate: string | null,
    isDurumu: string | null,
    requestType: string | null,
    lokasyon: string | null
  }
}
```

---

## 📋 Önemli Notlar

### 1. ⏰ Tarih Filtresi Mantığı
- **Aktif endpoint'ler** (aracTalep, taleplerim, aracIsEmri, isAtamalarim):
  - Sadece bugün ve gelecekteki işleri gösterir
  - Routes'daki **son drop date >= bugün** olanlar listelenir
  
- **Geçmiş endpoint** (gecmisTaleplerim):
  - Sadece geçmişteki işleri gösterir
  - Routes'daki **son drop date < bugün** olanlar listelenir

### 2. 🔐 Authentication
Tüm isteklerde JWT token gereklidir:
```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

### 3. ⚡ Performans
- Sayfalama kullanın (pagination)
- İlk yüklemede `limit=20` yeterli
- Tarih aralığı filtreleri performansı artırır

---

## 💻 React/TypeScript Örnek Kod

```typescript
import axios from 'axios';

// API Base URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Types
interface TalepItem {
  _id: string;
  requestType: string;
  isDurumu: string;
  transferTarihi: string;
  detay?: {
    routes?: any[];
    companions?: any[];
  };
}

interface TalepResponse {
  page: number;
  limit: number;
  total: number;
  items: TalepItem[];
  filters: {
    startDate: string | null;
    endDate: string | null;
    isDurumu: string | null;
    requestType: string | null;
    lokasyon: string | null;
  };
}

interface FetchTalepParams {
  requestType?: string;
  isDurumu?: string;
  startDate?: string;
  endDate?: string;
  lokasyon?: string;
  sofor?: string;
  page?: number;
  limit?: number;
}

// API Service
class TalepService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  // Araç Talepleri
  async fetchAracTalep(params: FetchTalepParams = {}): Promise<TalepResponse> {
    const response = await axios.get(`${API_BASE}/talepler/aracTalep`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // Benim Taleplerim (Aktif)
  async fetchTaleplerim(params: FetchTalepParams = {}): Promise<TalepResponse> {
    const response = await axios.get(`${API_BASE}/talepler/taleplerim`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // ⭐ YENİ: Geçmiş Taleplerim
  async fetchGecmisTaleplerim(params: FetchTalepParams = {}): Promise<TalepResponse> {
    const response = await axios.get(`${API_BASE}/talepler/gecmisTaleplerim`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // İş Emirleri
  async fetchAracIsEmri(params: FetchTalepParams = {}): Promise<TalepResponse> {
    const response = await axios.get(`${API_BASE}/talepler/aracIsEmri`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  // İş Atamalarım
  async fetchIsAtamalarim(params: FetchTalepParams = {}): Promise<TalepResponse> {
    const response = await axios.get(`${API_BASE}/talepler/isAtamalarim`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data;
  }
}

export const talepService = new TalepService();

// React Component Örneği
import React, { useState, useEffect } from 'react';

export const TaleplerimPage: React.FC = () => {
  const [data, setData] = useState<TalepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    requestType: '',
    isDurumu: '',
    startDate: '',
    endDate: '',
    page: 1
  });

  // Veri çekme
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await talepService.fetchTaleplerim(filters);
      setData(response);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      alert('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Filtre değişikliği
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Sayfa değişikliği
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="taleplerim-page">
      <h1>Benim Taleplerim</h1>

      {/* Filtreler */}
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
          placeholder="Başlangıç Tarihi"
        />

        <input 
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="Bitiş Tarihi"
        />
      </div>

      {/* Yükleniyor */}
      {loading && <div className="loading">Yükleniyor...</div>}

      {/* Veri Listesi */}
      {!loading && data && (
        <>
          <div className="data-info">
            <p>Toplam {data.total} kayıt bulundu</p>
            <p>Sayfa {data.page} / {Math.ceil(data.total / data.limit)}</p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Tip</th>
                <th>Durum</th>
                <th>Transfer Tarihi</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item._id}>
                  <td>{item.requestType}</td>
                  <td>{item.isDurumu}</td>
                  <td>{new Date(item.transferTarihi).toLocaleDateString('tr-TR')}</td>
                  <td>
                    {item.detay?.routes?.length || 0} rota,{' '}
                    {item.detay?.companions?.length || 0} refakatçi
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={data.page === 1}
              onClick={() => handlePageChange(data.page - 1)}
            >
              Önceki
            </button>
            <span>Sayfa {data.page}</span>
            <button 
              disabled={data.page * data.limit >= data.total}
              onClick={() => handlePageChange(data.page + 1)}
            >
              Sonraki
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 🎯 Geliştirme Önerileri

### 1. **Tabs/Sekmeler Ekleyin**
```
- Aktif Taleplerim (taleplerim endpoint)
- Geçmiş Taleplerim (gecmisTaleplerim endpoint) ⭐ YENİ
```

### 2. **Tarih Filtreleri**
- "Bugün", "Bu Hafta", "Bu Ay" gibi hızlı filtre butonları ekleyin
- Date range picker kullanın

### 3. **Export Özelliği**
- Filtrelenmiş verileri Excel/CSV olarak export edebilme

### 4. **Sonsuz Scroll veya "Daha Fazla Yükle"**
- Sayfalama yerine kullanıcı deneyimini iyileştirmek için

### 5. **Loading States**
- Skeleton loader ekleyin
- Optimistic UI güncellemeleri

---

## 📞 Destek

Herhangi bir sorunuz olursa:
- Backend Developer: backend@acibadem.com
- API Dokümantasyonu: `docs/api/API_FRONTEND_KULLANIM.md` dosyasına bakın

