# API Dokümantasyonu

Acıbadem Backend API dokümantasyonu.

## İçindekiler

| Doküman | Açıklama |
|---------|----------|
| [Kapsamlı API](KAPSAMLI_API_DOKUMANI.md) | Tüm servislerin genel API referansı |
| [Talep Servisleri](TALEP_SERVISLERI_API_DOKUMANI.md) | Hasta, Misafir, Diğer, Otel talep API'leri |
| [Talep Frontend Kullanım](API_FRONTEND_KULLANIM.md) | Talepler endpoint'leri ve filtreleme |
| [Talep Request Örnekleri](FRONTEND_REQUEST_ORNEKLERI.md) | Axios/Fetch örnek kodları |
| [Sohbet API](SOHBET_API_DOCUMENTATION.md) | Chat/sohbet REST endpoint'leri |
| [Takvim API](TAKVIM_API_DOCUMENTATION.md) | Takvim etkinlikleri API |

## Kimlik Doğrulama

Tüm API isteklerinde JWT token gereklidir:

```
Authorization: Bearer <token>
```

## Base URL

- **Development:** `http://localhost:5000/api`
- **Production:** `https://your-domain.com/api`
