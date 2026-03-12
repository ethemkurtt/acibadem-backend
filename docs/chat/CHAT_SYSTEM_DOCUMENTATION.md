# 💬 Gerçek Zamanlı Chat Sistemi - Teknik Dokümantasyon

## 🎯 Genel Bakış

Bu proje, **Socket.IO** ve **Redis** tabanlı, gerçek zamanlı mesajlaşma sistemi içermektedir.

### ✅ Özellikler

- ✅ **Gerçek Zamanlı Mesajlaşma** - WebSocket ile anlık mesaj iletimi
- ✅ **Online/Offline Tracking** - Kullanıcıların çevrimiçi durumunu izleme
- ✅ **Anlık Bildirimler** - Yeni mesaj, sohbet bildirimleri
- ✅ **Typing Indicators** - "Yazıyor..." göstergesi
- ✅ **Read Receipts** - Mesaj okundu bilgisi
- ✅ **Optimize Edilmiş** - Aggregation pipeline, indexing, pagination
- ✅ **Scalable** - Redis adapter ile horizontal scaling
- ✅ **Güvenli** - JWT authentication

---

## 🏗️ Mimari

```
┌─────────────┐          ┌──────────────┐          ┌──────────┐
│   Client    │ ◄──WS──► │  Socket.IO   │ ◄──────► │  Redis   │
│  (Browser)  │          │   Server     │          │ (PubSub) │
└─────────────┘          └──────────────┘          └──────────┘
                                │
                                │
                         ┌──────▼───────┐
                         │   MongoDB    │
                         │ (Sohbet,     │
                         │  Mesaj, etc) │
                         └──────────────┘
```

---

## 📡 WebSocket Events (Socket.IO)

### 🔌 Bağlantı (Connection)

#### Client → Server: `connect`
```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  },
  transports: ["websocket", "polling"]
});

socket.on("connect", () => {
  console.log("Bağlandı:", socket.id);
});
```

#### Server → Client: `user:online` / `user:offline`
```javascript
// Kullanıcı online olduğunda
socket.on("user:online", (data) => {
  console.log("Kullanıcı online:", data);
  // {
  //   userId: "64abc...",
  //   user: { _id, name, email },
  //   timestamp: "2025-01-15T10:00:00.000Z"
  // }
});

// Kullanıcı offline olduğunda
socket.on("user:offline", (data) => {
  console.log("Kullanıcı offline:", data);
  // {
  //   userId: "64abc...",
  //   user: { _id, name, email },
  //   timestamp: "2025-01-15T10:00:00.000Z",
  //   reason: "transport close"
  // }
});
```

---

### 💬 Mesajlaşma

#### Client → Server: `chat:join`
Bir sohbet odasına katıl:
```javascript
socket.emit("chat:join", {
  sohbet_id: "64abc123..."
});

socket.on("chat:joined", (data) => {
  console.log("Sohbete katıldınız:", data);
  // { sohbet_id: "...", message: "Sohbete başarıyla katıldınız." }
});
```

#### Client → Server: `message:send`
Mesaj gönder:
```javascript
socket.emit("message:send", {
  sohbet_id: "64abc123...",
  message: "Merhaba, nasılsın?"
});
```

#### Server → Client: `message:new`
Yeni mesaj geldiğinde:
```javascript
socket.on("message:new", (data) => {
  console.log("Yeni mesaj:", data);
  // {
  //   _id: "64def...",
  //   mesaj_id: "...",
  //   sohbet_id: "64abc...",
  //   message: "Merhaba, nasılsın?",
  //   time: "2025-01-15T10:30:00.000Z",
  //   read_at: null,
  //   sender: {
  //     _id: "64xyz...",
  //     name: "Ahmet Yılmaz",
  //     email: "ahmet@example.com"
  //   }
  // }
});
```

---

### ✍️ Typing Indicators

#### Client → Server: `typing:start` / `typing:stop`
```javascript
// Kullanıcı yazmaya başladığında
socket.emit("typing:start", {
  sohbet_id: "64abc123..."
});

// Kullanıcı yazmayı bıraktığında (debounce ile 2-3 saniye sonra)
socket.emit("typing:stop", {
  sohbet_id: "64abc123..."
});
```

#### Server → Client: `typing:user`
```javascript
socket.on("typing:user", (data) => {
  console.log("Kullanıcı yazıyor:", data);
  // {
  //   sohbet_id: "64abc...",
  //   user: { _id, name, email },
  //   isTyping: true
  // }
});
```

---

### ✅ Read Receipts

#### Client → Server: `message:read`
Mesajları okundu işaretle:
```javascript
socket.emit("message:read", {
  sohbet_id: "64abc123...",
  mesaj_ids: ["64def1...", "64def2...", "64def3..."]
});
```

#### Server → Client: `message:read_by`
Mesajlar okunduğunda:
```javascript
socket.on("message:read_by", (data) => {
  console.log("Mesajlar okundu:", data);
  // {
  //   sohbet_id: "64abc...",
  //   mesaj_ids: ["64def1...", "64def2..."],
  //   read_by: { _id, name, email },
  //   read_at: "2025-01-15T10:35:00.000Z"
  // }
});
```

---

### 🔔 Bildirimler

#### Server → Client: `notification:new_message`
Yeni mesaj bildirimi (kullanıcı başka sayfadaysa):
```javascript
socket.on("notification:new_message", (data) => {
  console.log("Yeni mesaj bildirimi:", data);
  // {
  //   sohbet_id: "64abc...",
  //   message: { ... }, // Mesaj detayı
  //   notification: {
  //     title: "Ahmet Yılmaz yeni mesaj gönderdi",
  //     body: "Merhaba, nasılsın?",
  //     timestamp: "2025-01-15T10:30:00.000Z"
  //   }
  // }
  
  // Browser notification göster
  if (Notification.permission === "granted") {
    new Notification(data.notification.title, {
      body: data.notification.body,
      icon: "/logo.png"
    });
  }
});
```

#### Server → Client: `sohbet:new`
Yeni sohbet başlatıldı bildirimi:
```javascript
socket.on("sohbet:new", (data) => {
  console.log("Yeni sohbet:", data);
  // {
  //   sohbet: { ... }, // Sohbet detayı
  //   message: "Ahmet Yılmaz size yeni bir sohbet başlattı.",
  //   timestamp: "2025-01-15T10:00:00.000Z"
  // }
});
```

---

### 👥 Online Kullanıcılar

#### Client → Server: `users:get_online`
Online kullanıcıları getir:
```javascript
socket.emit("users:get_online");

socket.on("users:online_list", (data) => {
  console.log("Online kullanıcılar:", data);
  // {
  //   users: [
  //     {
  //       userId: "64abc...",
  //       user: { _id, name, email },
  //       connectedAt: "2025-01-15T09:00:00.000Z"
  //     },
  //     ...
  //   ],
  //   count: 5
  // }
});
```

---

### ❌ Hata Yönetimi

```javascript
socket.on("error", (data) => {
  console.error("Socket hatası:", data);
  // { message: "Bu sohbete erişim yetkiniz yok." }
});

socket.on("connect_error", (err) => {
  console.error("Bağlantı hatası:", err.message);
  // "Authentication error: Token bulunamadı"
});
```

---

## 🌐 HTTP API Endpoints

### 1. Kullanıcı Ara (Yeni Sohbet İçin)
```http
GET /api/sohbet/users/search?search=ethem%20kurt
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `search` (string, required): Arama terimi (isim veya email)
  - Minimum 2 karakter
  - Case-insensitive
  - Hem isimde hem email'de arar

**Response:**
```json
{
  "message": "Kullanıcılar başarıyla getirildi.",
  "users": [
    {
      "_id": "64abc123...",
      "name": "Ethem Kurt",
      "email": "ethem@example.com",
      "role": "user",
      "departman": {
        "_id": "64def...",
        "name": "IT Departmanı"
      },
      "lokasyon": {
        "_id": "64ghi...",
        "name": "İstanbul"
      }
    },
    {
      "_id": "64xyz789...",
      "name": "Ethem Yılmaz",
      "email": "ethem.yilmaz@example.com",
      "role": "admin",
      "departman": {
        "_id": "64jkl...",
        "name": "Yönetim"
      },
      "lokasyon": {
        "_id": "64mno...",
        "name": "Ankara"
      }
    }
  ],
  "total": 2
}
```

**Özellikler:**
- ✅ Login olan kullanıcı hariç (kendisi çıkar)
- ✅ İsim veya email'de arama yapar
- ✅ Maksimum 20 sonuç
- ✅ Departman ve lokasyon bilgileri dahil
- ✅ Case-insensitive arama

**Örnek Kullanım:**
```javascript
// Kullanıcı ara
const searchTerm = "ethem kurt";
const response = await fetch(
  `/api/sohbet/users/search?search=${encodeURIComponent(searchTerm)}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
const data = await response.json();
console.log(data.users); // Bulunan kullanıcılar
```

---

### 2. Yeni Sohbet Başlat
```http
POST /api/sohbet
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "hedef_user_id": "64abc123...",
  "sohbet_tipi": "iki_tarafli"
}
```

**Response:**
```json
{
  "message": "Sohbet başarıyla oluşturuldu.",
  "sohbet": {
    "_id": "64def456...",
    "sohbet_tipi": "iki_tarafli",
    "baslatan_user_id": {
      "_id": "64xyz...",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com"
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### 3. Kullanıcının Sohbetlerini Getir (Optimize)
```http
GET /api/sohbet/my
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Sohbetler başarıyla getirildi.",
  "kullanici": {
    "user_id": "64xyz...",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com"
  },
  "sohbetler": [
    {
      "sohbet_id": "64def...",
      "sohbet_tipi": "iki_tarafli",
      "katilimcilar": [
        {
          "user_id": "64abc...",
          "name": "Mehmet Demir",
          "email": "mehmet@example.com",
          "joined_at": "2025-01-15T10:00:00.000Z"
        }
      ],
      "son_mesaj": {
        "mesaj_id": "64ghi...",
        "message": "Görüşmek üzere!",
        "time": "2025-01-15T11:30:00.000Z",
        "sender": {
          "_id": "64abc...",
          "name": "Mehmet Demir"
        }
      },
      "okunmamis_mesaj_sayisi": 3,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T11:30:00.000Z"
    }
  ],
  "toplam_sohbet": 1
}
```

---

### 4. Sohbet Mesajlarını Getir (Pagination)
```http
GET /api/sohbet/64def456.../mesajlar?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "page": 1,
  "limit": 50,
  "total": 125,
  "mesajlar": [
    {
      "_id": "64ghi...",
      "mesaj_id": "...",
      "message": "Merhaba!",
      "time": "2025-01-15T10:05:00.000Z",
      "read_at": "2025-01-15T10:06:00.000Z",
      "sender": {
        "_id": "64abc...",
        "name": "Mehmet Demir",
        "email": "mehmet@example.com"
      }
    },
    ...
  ]
}
```

---

### 5. Mesaj Gönder (HTTP Fallback)
```http
POST /api/sohbet/mesaj
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sohbet_id": "64def456...",
  "message": "Merhaba, nasılsın?"
}
```

**Response:**
```json
{
  "message": "Mesaj başarıyla gönderildi.",
  "data": {
    "_id": "64jkl...",
    "mesaj_id": "...",
    "sohbet_id": "64def...",
    "message": "Merhaba, nasılsın?",
    "time": "2025-01-15T10:30:00.000Z",
    "read_at": null,
    "sender": {
      "_id": "64xyz...",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com"
    }
  }
}
```

---

### 5. Okunmamış Mesaj Sayısı
```http
GET /api/sohbet/unread/count
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "unread_count": 7,
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### 6. Mesajları Okundu İşaretle
```http
POST /api/sohbet/messages/mark-read
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sohbet_id": "64def456..."
}
```

**Response:**
```json
{
  "message": "Mesajlar okundu olarak işaretlendi.",
  "modified_count": 5,
  "read_at": "2025-01-15T12:05:00.000Z"
}
```

---

### 7. Sohbet Sil
```http
DELETE /api/sohbet/64def456...
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Sohbet başarıyla silindi.",
  "sohbet_id": "64def456...",
  "deleted_at": "2025-01-15T12:10:00.000Z"
}
```

---

## ⚡ Performans Optimizasyonları

### 1. Database Indexes
```javascript
// Mesaj Model
mesajSchema.index({ sohbet_id: 1, time: -1 });
mesajSchema.index({ sohbet_id: 1, read_at: 1 });
mesajSchema.index({ user_id: 1, time: -1 });

// SohbetKisileri Model
sohbetKisileriSchema.index({ user_id: 1 });
sohbetKisileriSchema.index({ sohbet_id: 1 });
sohbetKisileriSchema.index({ sohbet_id: 1, user_id: 1 }, { unique: true });
```

### 2. Aggregation Pipeline
Sohbet listesi çekme işlemi tek query ile yapılır:
- ✅ Sohbet bilgileri
- ✅ Katılımcılar
- ✅ Son mesaj
- ✅ Okunmamış mesaj sayısı

### 3. Redis Caching
- Online kullanıcılar Redis'te tutulur
- Horizontal scaling için Redis Adapter

### 4. Pagination
- Mesajlar sayfalama ile getirilir (default: 50)
- Eski mesajlar lazy loading

---

## 🔒 Güvenlik

### JWT Authentication
```javascript
// Socket.IO middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});
```

### Authorization
- Kullanıcı sadece kendi sohbetlerine erişebilir
- Mesaj gönderme yetkisi kontrol edilir
- Sohbet silme sadece başlatan için

---

## 🚀 Deployment

### Environment Variables
```env
# MongoDB
MONGO_URI=mongodb://...

# JWT
JWT_SECRET=your_secret_key

# Redis (optional - for scaling)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Render.com Deployment
1. Socket.IO WebSocket destekler
2. Redis Labs (ücretsiz tier)
3. MongoDB Atlas
4. Environment variables ayarla

---

## 📊 Monitoring

### Socket.IO Stats
```javascript
const io = require("./utils/socketService").getIO();

// Bağlı kullanıcı sayısı
console.log("Connected sockets:", io.engine.clientsCount);

// Online kullanıcılar
const { getOnlineUsersCount } = require("./utils/socketService");
console.log("Online users:", getOnlineUsersCount());
```

---

## 🐛 Debugging

### Client Debug
```javascript
localStorage.debug = "socket.io-client:socket";
```

### Server Debug
```bash
DEBUG=socket.io:* node server.js
```

---

## 📝 Best Practices

1. **WebSocket First**: Mesaj gönderme için öncelikle WebSocket kullan
2. **HTTP Fallback**: WebSocket başarısız olursa HTTP API kullan
3. **Reconnection**: Client otomatik reconnect yapsın
4. **Pagination**: Mesajları sayfalama ile getir
5. **Debounce Typing**: Yazıyor göstergesi 2-3 saniye debounce kullan
6. **Browser Notifications**: Kullanıcı izni al ve bildirim göster
7. **Error Handling**: Tüm socket eventleri için error handler ekle
8. **Performance**: Büyük listeler için virtual scrolling kullan

---

## 📚 Kaynaklar

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)

---

## 🆘 Destek

Sorularınız için: backend@example.com

