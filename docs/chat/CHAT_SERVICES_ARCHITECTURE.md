# 🔧 Chat Sistemi - Servis Mimarisi ve Çalışma Mantığı

## 📋 Framework Bağımsız Mimari

Bu dokümantasyon **vanilla JavaScript, Vue, Angular, Svelte** veya herhangi bir framework'te kullanılabilir.

---

## 🏗️ Servis Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │ SocketService│◄───┤ ChatService │◄───┤ UI Layer   │ │
│  └──────┬───────┘    └──────┬──────┘    └────────────┘ │
│         │                   │                           │
│         │            ┌──────▼──────┐                    │
│         │            │  HTTP API   │                    │
│         │            │  Service    │                    │
│         │            └─────────────┘                    │
└─────────┼───────────────────┼───────────────────────────┘
          │                   │
          │ WebSocket         │ HTTP
          │                   │
┌─────────▼───────────────────▼───────────────────────────┐
│                      BACKEND                             │
│  ┌──────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │  Socket.IO   │    │   Express   │    │  MongoDB   │ │
│  │   Server     │    │   Routes    │    │            │ │
│  └──────────────┘    └─────────────┘    └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 1. SocketService (WebSocket Yönetimi)

### Amaç
- WebSocket bağlantısını yönetir
- Event'leri dinler ve emit eder
- Reconnection mantığı
- Authentication

### Implementasyon

```javascript
// services/SocketService.js

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Event listener'ları sakla
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Socket bağlantısını başlat
   * @param {string} url - Backend URL (örn: "http://localhost:5000")
   * @param {string} token - JWT token
   */
  connect(url, token) {
    if (this.socket?.connected) {
      console.log("Socket zaten bağlı");
      return this.socket;
    }

    // Socket.IO client yükle (CDN veya npm)
    this.socket = io(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this._setupListeners();
    return this.socket;
  }

  /**
   * Temel event listener'ları kur
   */
  _setupListeners() {
    this.socket.on("connect", () => {
      console.log("✅ Socket bağlandı:", this.socket.id);
      this.reconnectAttempts = 0;
      this._emit("connection:success", { socketId: this.socket.id });
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket bağlantı hatası:", err.message);
      this.reconnectAttempts++;
      this._emit("connection:error", { error: err.message });
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket bağlantısı kesildi:", reason);
      this._emit("connection:lost", { reason });
    });

    this.socket.on("error", (data) => {
      console.error("❌ Socket error:", data);
      this._emit("error", data);
    });
  }

  /**
   * Event dinle
   * @param {string} event - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn("Socket henüz bağlanmadı");
      return;
    }

    this.socket.on(event, callback);
    
    // Listener'ı sakla (cleanup için)
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Event listener'ı kaldır
   * @param {string} event - Event adı
   * @param {Function} callback - Callback fonksiyonu (opsiyonel)
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }

    // Listener'ı listeden kaldır
    if (this.listeners.has(event)) {
      if (callback) {
        const listeners = this.listeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      } else {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Event gönder (emit)
   * @param {string} event - Event adı
   * @param {Object} data - Gönderilecek data
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn("Socket bağlı değil, emit yapılamadı:", event);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  /**
   * Internal event emit (kendi event'lerimiz için)
   */
  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  /**
   * Bağlantıyı kes
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log("Socket bağlantısı kapatıldı");
    }
  }

  /**
   * Bağlı mı kontrol et
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Socket ID'yi al
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Manuel reconnect
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Singleton pattern (tek instance)
export default new SocketService();
```

---

## 📡 2. HTTPService (REST API İşlemleri)

### Amaç
- HTTP isteklerini yönetir
- Token'ı otomatik ekler
- Error handling
- Retry mekanizması

### Implementasyon

```javascript
// services/HTTPService.js

class HTTPService {
  constructor() {
    this.baseURL = "http://localhost:5000/api"; // Backend URL
    this.token = null;
    this.timeout = 30000; // 30 saniye
  }

  /**
   * Token'ı set et
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Token'ı kaldır
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Headers oluştur
   */
  _getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * HTTP request gönder
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body (opsiyonel)
   * @param {Object} options - Ek options (opsiyonel)
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: this._getHeaders(),
      ...options,
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
    }

    try {
      // Timeout kontrolü
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Response parse et
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: responseData.message || responseData.error || "İstek başarısız",
          data: responseData,
        };
      }

      return responseData;
    } catch (error) {
      if (error.name === "AbortError") {
        throw { status: 408, message: "İstek zaman aşımına uğradı" };
      }

      console.error(`HTTP ${method} ${endpoint} hatası:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request("GET", endpoint, null, options);
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request("POST", endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request("PUT", endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request("PATCH", endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request("DELETE", endpoint, null, options);
  }
}

// Singleton pattern
export default new HTTPService();
```

---

## 💬 3. ChatService (Ana İş Mantığı)

### Amaç
- Chat işlemlerini yönetir
- SocketService ve HTTPService'i kullanır
- Business logic katmanı
- State management (framework'e göre değişebilir)

### Implementasyon

```javascript
// services/ChatService.js

import SocketService from "./SocketService.js";
import HTTPService from "./HTTPService.js";

class ChatService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.callbacks = new Map(); // Event callback'leri
  }

  /**
   * Chat servisini başlat
   * @param {string} backendURL - Backend URL
   * @param {string} token - JWT token
   * @param {Object} user - Kullanıcı bilgileri
   */
  async initialize(backendURL, token, user) {
    if (this.isInitialized) {
      console.warn("ChatService zaten başlatılmış");
      return;
    }

    this.currentUser = user;
    HTTPService.setToken(token);
    SocketService.connect(backendURL, token);

    this._setupSocketListeners();
    this.isInitialized = true;

    console.log("✅ ChatService başlatıldı");
  }

  /**
   * Socket event listener'larını kur
   */
  _setupSocketListeners() {
    // ✅ Yeni mesaj geldiğinde
    SocketService.on("message:new", (data) => {
      console.log("📨 Yeni mesaj:", data);
      this._trigger("message:received", data);
      
      // Ses bildirimi
      this._playNotificationSound();
    });

    // ✅ Bildirim geldiğinde
    SocketService.on("notification:new_message", (data) => {
      console.log("🔔 Bildirim:", data);
      this._trigger("notification:received", data);
      
      // Browser notification
      this._showBrowserNotification(data.notification);
    });

    // ✅ Kullanıcı online olduğunda
    SocketService.on("user:online", (data) => {
      console.log("🟢 Online:", data.user.name);
      this._trigger("user:online", data);
    });

    // ✅ Kullanıcı offline olduğunda
    SocketService.on("user:offline", (data) => {
      console.log("🔴 Offline:", data.user.name);
      this._trigger("user:offline", data);
    });

    // ✅ Yazıyor göstergesi
    SocketService.on("typing:user", (data) => {
      this._trigger("typing:changed", data);
    });

    // ✅ Mesajlar okundu
    SocketService.on("message:read_by", (data) => {
      console.log("✅ Mesajlar okundu:", data);
      this._trigger("messages:read", data);
    });

    // ✅ Sohbet silindi
    SocketService.on("sohbet:deleted", (data) => {
      console.log("🗑️ Sohbet silindi:", data);
      this._trigger("chat:deleted", data);
    });

    // ✅ Hata
    SocketService.on("error", (data) => {
      console.error("❌ Socket hatası:", data);
      this._trigger("error", data);
    });
  }

  /**
   * Event callback kaydet
   * @param {string} event - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * Event callback kaldır
   * @param {string} event - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  off(event, callback) {
    if (this.callbacks.has(event)) {
      if (callback) {
        const callbacks = this.callbacks.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.callbacks.delete(event);
      }
    }
  }

  /**
   * Event trigger et (internal)
   */
  _trigger(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event callback hatası (${event}):`, error);
        }
      });
    }
  }

  // ==================== CHAT İŞLEMLERİ ====================

  /**
   * Kullanıcı ara (Yeni sohbet başlatmak için)
   * @param {string} search - Arama terimi (isim veya email)
   * @returns {Promise<Array>} - Kullanıcı listesi
   */
  async searchUsers(search) {
    try {
      if (!search || search.trim().length < 2) {
        return [];
      }

      const response = await HTTPService.get(
        `/sohbet/users/search?search=${encodeURIComponent(search.trim())}`
      );
      return response.users || [];
    } catch (error) {
      console.error("Kullanıcı arama hatası:", error);
      throw error;
    }
  }

  /**
   * Kullanıcının sohbetlerini getir
   */
  async getMySohbets() {
    try {
      const response = await HTTPService.get("/sohbet/my");
      return response.sohbetler || [];
    } catch (error) {
      console.error("Sohbetler alınamadı:", error);
      throw error;
    }
  }

  /**
   * Yeni sohbet başlat
   * @param {string} hedef_user_id - Hedef kullanıcı ID
   * @param {string} sohbet_tipi - Sohbet tipi (opsiyonel)
   */
  async createSohbet(hedef_user_id, sohbet_tipi = null) {
    try {
      const response = await HTTPService.post("/sohbet", {
        hedef_user_id,
        sohbet_tipi,
      });
      
      this._trigger("chat:created", response.sohbet);
      return response.sohbet;
    } catch (error) {
      console.error("Sohbet oluşturulamadı:", error);
      throw error;
    }
  }

  /**
   * Sohbet mesajlarını getir
   * @param {string} sohbet_id - Sohbet ID
   * @param {number} page - Sayfa numarası
   * @param {number} limit - Sayfa başına mesaj sayısı
   */
  async getMessages(sohbet_id, page = 1, limit = 50) {
    try {
      const response = await HTTPService.get(
        `/sohbet/${sohbet_id}/mesajlar?page=${page}&limit=${limit}`
      );
      return response.mesajlar || [];
    } catch (error) {
      console.error("Mesajlar alınamadı:", error);
      throw error;
    }
  }

  /**
   * Mesaj gönder (WebSocket)
   * @param {string} sohbet_id - Sohbet ID
   * @param {string} message - Mesaj içeriği
   */
  sendMessage(sohbet_id, message) {
    if (!SocketService.isConnected()) {
      // WebSocket bağlı değilse HTTP fallback
      return this.sendMessageHTTP(sohbet_id, message);
    }

    const success = SocketService.emit("message:send", {
      sohbet_id,
      message: message.trim(),
    });

    if (!success) {
      console.warn("WebSocket emit başarısız, HTTP fallback kullanılıyor");
      return this.sendMessageHTTP(sohbet_id, message);
    }

    return Promise.resolve();
  }

  /**
   * Mesaj gönder (HTTP fallback)
   * @param {string} sohbet_id - Sohbet ID
   * @param {string} message - Mesaj içeriği
   */
  async sendMessageHTTP(sohbet_id, message) {
    try {
      const response = await HTTPService.post("/sohbet/mesaj", {
        sohbet_id,
        message: message.trim(),
      });
      
      // HTTP ile gönderince event trigger etmeliyiz
      this._trigger("message:sent", response.data);
      return response.data;
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      throw error;
    }
  }

  /**
   * Sohbet odasına katıl
   * @param {string} sohbet_id - Sohbet ID
   */
  joinChat(sohbet_id) {
    SocketService.emit("chat:join", { sohbet_id });
  }

  /**
   * Yazıyor göstergesini başlat
   * @param {string} sohbet_id - Sohbet ID
   */
  startTyping(sohbet_id) {
    SocketService.emit("typing:start", { sohbet_id });
  }

  /**
   * Yazıyor göstergesini durdur
   * @param {string} sohbet_id - Sohbet ID
   */
  stopTyping(sohbet_id) {
    SocketService.emit("typing:stop", { sohbet_id });
  }

  /**
   * Mesajları okundu işaretle (WebSocket)
   * @param {string} sohbet_id - Sohbet ID
   * @param {Array<string>} mesaj_ids - Mesaj ID'leri
   */
  markMessagesAsRead(sohbet_id, mesaj_ids) {
    if (SocketService.isConnected()) {
      SocketService.emit("message:read", { sohbet_id, mesaj_ids });
    } else {
      // HTTP fallback
      this.markMessagesAsReadHTTP(sohbet_id);
    }
  }

  /**
   * Mesajları okundu işaretle (HTTP fallback)
   * @param {string} sohbet_id - Sohbet ID
   */
  async markMessagesAsReadHTTP(sohbet_id) {
    try {
      const response = await HTTPService.post("/sohbet/messages/mark-read", {
        sohbet_id,
      });
      return response;
    } catch (error) {
      console.error("Mesajlar okundu işaretlenemedi:", error);
      throw error;
    }
  }

  /**
   * Okunmamış mesaj sayısını getir
   */
  async getUnreadCount() {
    try {
      const response = await HTTPService.get("/sohbet/unread/count");
      return response.unread_count || 0;
    } catch (error) {
      console.error("Okunmamış mesaj sayısı alınamadı:", error);
      throw error;
    }
  }

  /**
   * Sohbet sil
   * @param {string} sohbet_id - Sohbet ID
   */
  async deleteSohbet(sohbet_id) {
    try {
      const response = await HTTPService.delete(`/sohbet/${sohbet_id}`);
      this._trigger("chat:deleted", { sohbet_id });
      return response;
    } catch (error) {
      console.error("Sohbet silinemedi:", error);
      throw error;
    }
  }

  /**
   * Online kullanıcıları getir
   */
  getOnlineUsers() {
    SocketService.emit("users:get_online");
    
    // Response dinle (bir kere)
    return new Promise((resolve) => {
      const handler = (data) => {
        SocketService.off("users:online_list", handler);
        resolve(data.users || []);
      };
      SocketService.on("users:online_list", handler);
    });
  }

  // ==================== YARDIMCI METOTLAR ====================

  /**
   * Browser notification göster
   */
  _showBrowserNotification(notification) {
    if (!("Notification" in window)) {
      console.warn("Browser bildirimleri desteklenmiyor");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "chat-notification",
      });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this._showBrowserNotification(notification);
        }
      });
    }
  }

  /**
   * Bildirim sesi çal
   */
  _playNotificationSound() {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ses çalma başarısız (kullanıcı etkileşimi gerekli)
      });
    } catch (error) {
      console.warn("Bildirim sesi çalınamadı:", error);
    }
  }

  /**
   * Browser notification izni iste
   */
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Servisi kapat
   */
  destroy() {
    SocketService.disconnect();
    HTTPService.clearToken();
    this.callbacks.clear();
    this.isInitialized = false;
    this.currentUser = null;
    console.log("ChatService kapatıldı");
  }
}

// Singleton pattern
export default new ChatService();
```

---

## 🎯 Kullanım Örnekleri

### 1. Başlatma (Initialize)

```javascript
import ChatService from "./services/ChatService.js";

// Login olduktan sonra
const user = { _id: "...", name: "Ahmet", email: "ahmet@example.com" };
const token = "your_jwt_token";
const backendURL = "http://localhost:5000";

await ChatService.initialize(backendURL, token, user);

// Browser notification izni iste
await ChatService.requestNotificationPermission();
```

### 2. Sohbetleri Getir

```javascript
// Sohbet listesini çek
const sohbetler = await ChatService.getMySohbets();

// UI'de göster
sohbetler.forEach((sohbet) => {
  console.log("Sohbet:", sohbet.sohbet_id);
  console.log("Katılımcılar:", sohbet.katilimcilar);
  console.log("Son mesaj:", sohbet.son_mesaj);
  console.log("Okunmamış:", sohbet.okunmamis_mesaj_sayisi);
});
```

### 3. Kullanıcı Ara (Yeni Sohbet İçin)

```javascript
// Kullanıcı ara input'u
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", async (e) => {
  const searchTerm = e.target.value;
  
  if (searchTerm.length < 2) {
    // Arama terimi çok kısa
    return;
  }
  
  try {
    const users = await ChatService.searchUsers(searchTerm);
    console.log("Bulunan kullanıcılar:", users);
    
    // UI'de göster
    displaySearchResults(users);
  } catch (error) {
    console.error("Arama hatası:", error);
  }
});

// Örnek sonuç:
// [
//   {
//     _id: "64abc123...",
//     name: "Ethem Kurt",
//     email: "ethem@example.com",
//     role: "user",
//     departman: { name: "IT" },
//     lokasyon: { name: "İstanbul" }
//   },
//   ...
// ]
```

### 4. Yeni Sohbet Başlat

```javascript
const hedefUserId = "64abc123...";

try {
  const yeniSohbet = await ChatService.createSohbet(hedefUserId);
  console.log("Yeni sohbet oluşturuldu:", yeniSohbet);
  
  // Sohbet odasına katıl
  ChatService.joinChat(yeniSohbet._id);
} catch (error) {
  console.error("Hata:", error.message);
}
```

### 5. Mesajları Getir

```javascript
const sohbetId = "64def456...";

// İlk sayfa
const mesajlar = await ChatService.getMessages(sohbetId, 1, 50);

// Mesajları göster
mesajlar.forEach((mesaj) => {
  console.log(`${mesaj.sender.name}: ${mesaj.message}`);
});

// Daha eski mesajlar yükle (pagination)
const eskiMesajlar = await ChatService.getMessages(sohbetId, 2, 50);
```

### 6. Mesaj Gönder

```javascript
const sohbetId = "64def456...";
const mesaj = "Merhaba, nasılsın?";

// WebSocket ile gönder (tercih edilen)
ChatService.sendMessage(sohbetId, mesaj);

// Otomatik olarak HTTP fallback kullanır (WebSocket bağlı değilse)
```

### 7. Event Listener'lar

```javascript
// Yeni mesaj geldiğinde
ChatService.on("message:received", (data) => {
  console.log("Yeni mesaj:", data);
  
  // UI'yi güncelle
  addMessageToUI(data);
  
  // Mesajı okundu işaretle
  ChatService.markMessagesAsRead(data.sohbet_id, [data.mesaj_id]);
});

// Bildirim geldiğinde
ChatService.on("notification:received", (data) => {
  console.log("Bildirim:", data.notification);
  
  // UI'de badge güncelle
  updateUnreadBadge();
});

// Online/Offline durumu
ChatService.on("user:online", (data) => {
  console.log("Online:", data.user.name);
  updateUserStatus(data.userId, "online");
});

ChatService.on("user:offline", (data) => {
  console.log("Offline:", data.user.name);
  updateUserStatus(data.userId, "offline");
});

// Yazıyor göstergesi
ChatService.on("typing:changed", (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.sohbet_id, data.user);
  } else {
    hideTypingIndicator(data.sohbet_id, data.user);
  }
});

// Sohbet silindi
ChatService.on("chat:deleted", (data) => {
  console.log("Sohbet silindi:", data.sohbet_id);
  removeChatFromUI(data.sohbet_id);
});
```

### 8. Yazıyor Göstergesi

```javascript
let typingTimeout = null;

// Input'ta yazarken
inputElement.addEventListener("input", () => {
  // Yazıyor başlat
  ChatService.startTyping(sohbetId);
  
  // Debounce: 2 saniye sonra durdur
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    ChatService.stopTyping(sohbetId);
  }, 2000);
});

// Mesaj gönderince
sendButton.addEventListener("click", () => {
  ChatService.stopTyping(sohbetId);
  ChatService.sendMessage(sohbetId, inputElement.value);
  inputElement.value = "";
});
```

### 9. Okunmamış Mesaj Sayısı

```javascript
// Sayacı güncelle
async function updateUnreadBadge() {
  const count = await ChatService.getUnreadCount();
  
  const badge = document.getElementById("unread-badge");
  badge.textContent = count;
  badge.style.display = count > 0 ? "block" : "none";
}

// Periyodik güncelleme (opsiyonel)
setInterval(updateUnreadBadge, 30000); // Her 30 saniye
```

### 10. Cleanup (Sayfa Kapanırken)

```javascript
window.addEventListener("beforeunload", () => {
  ChatService.destroy();
});

// Veya SPA'de route değişiminde
router.beforeEach(() => {
  ChatService.destroy();
});
```

---

## 🔄 State Management (Framework Bağımsız)

### Basit State Store

```javascript
// stores/ChatStore.js

class ChatStore {
  constructor() {
    this.state = {
      sohbetler: [],
      activeSohbet: null,
      messages: {}, // { sohbet_id: [mesajlar] }
      onlineUsers: new Set(),
      typingUsers: {}, // { sohbet_id: [users] }
    };
    this.listeners = new Map();
  }

  /**
   * State değişikliğini dinle
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  /**
   * State güncelle
   */
  setState(key, value) {
    this.state[key] = value;
    this._notify(key, value);
  }

  /**
   * State getir
   */
  getState(key) {
    return this.state[key];
  }

  /**
   * Listener'ları bilgilendir
   */
  _notify(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((callback) => callback(value));
    }
  }

  // Yardımcı metotlar
  setSohbetler(sohbetler) {
    this.setState("sohbetler", sohbetler);
  }

  setActiveSohbet(sohbet) {
    this.setState("activeSohbet", sohbet);
  }

  addMessage(sohbet_id, message) {
    const messages = this.state.messages[sohbet_id] || [];
    this.state.messages[sohbet_id] = [...messages, message];
    this._notify("messages", this.state.messages);
  }

  setUserOnline(userId) {
    this.state.onlineUsers.add(userId);
    this._notify("onlineUsers", this.state.onlineUsers);
  }

  setUserOffline(userId) {
    this.state.onlineUsers.delete(userId);
    this._notify("onlineUsers", this.state.onlineUsers);
  }
}

export default new ChatStore();
```

### Store Kullanımı

```javascript
import ChatStore from "./stores/ChatStore.js";

// Sohbet listesini dinle
ChatStore.subscribe("sohbetler", (sohbetler) => {
  console.log("Sohbetler güncellendi:", sohbetler);
  renderSohbetList(sohbetler);
});

// Mesajları dinle
ChatStore.subscribe("messages", (messages) => {
  const activeSohbet = ChatStore.getState("activeSohbet");
  if (activeSohbet) {
    const sohbetMessages = messages[activeSohbet._id] || [];
    renderMessages(sohbetMessages);
  }
});

// Online kullanıcıları dinle
ChatStore.subscribe("onlineUsers", (onlineUsers) => {
  updateOnlineIndicators(onlineUsers);
});
```

---

## 🚀 Tam Entegrasyon Örneği

### index.html

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Chat App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <!-- Chat UI buraya gelecek -->
    <div id="sidebar">
      <h2>Sohbetler</h2>
      <div id="chat-list"></div>
    </div>
    
    <div id="main">
      <div id="chat-header"></div>
      <div id="messages"></div>
      <div id="input-area">
        <input type="text" id="message-input" placeholder="Mesajınızı yazın...">
        <button id="send-button">Gönder</button>
      </div>
    </div>
  </div>

  <!-- Socket.IO Client -->
  <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
  
  <!-- Servisler -->
  <script type="module" src="services/SocketService.js"></script>
  <script type="module" src="services/HTTPService.js"></script>
  <script type="module" src="services/ChatService.js"></script>
  <script type="module" src="stores/ChatStore.js"></script>
  
  <!-- Ana uygulama -->
  <script type="module" src="app.js"></script>
</body>
</html>
```

### app.js

```javascript
import ChatService from "./services/ChatService.js";
import ChatStore from "./stores/ChatStore.js";

// ==================== BAŞLATMA ====================

async function init() {
  // Token ve user bilgisini al (localStorage'dan veya login'den)
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "/login.html";
    return;
  }

  // ChatService'i başlat
  await ChatService.initialize("http://localhost:5000", token, user);

  // Event listener'ları kur
  setupEventListeners();

  // Sohbetleri yükle
  await loadSohbetler();

  // Browser notification izni iste
  await ChatService.requestNotificationPermission();
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Yeni mesaj geldiğinde
  ChatService.on("message:received", (data) => {
    ChatStore.addMessage(data.sohbet_id, data);
  });

  // Online/Offline
  ChatService.on("user:online", (data) => {
    ChatStore.setUserOnline(data.userId);
  });

  ChatService.on("user:offline", (data) => {
    ChatStore.setUserOffline(data.userId);
  });

  // Yazıyor göstergesi
  ChatService.on("typing:changed", (data) => {
    updateTypingIndicator(data);
  });

  // UI event'leri
  document.getElementById("send-button").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Yazıyor göstergesi
  let typingTimeout;
  document.getElementById("message-input").addEventListener("input", () => {
    const activeSohbet = ChatStore.getState("activeSohbet");
    if (activeSohbet) {
      ChatService.startTyping(activeSohbet._id);
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        ChatService.stopTyping(activeSohbet._id);
      }, 2000);
    }
  });
}

// ==================== İŞLEMLER ====================

async function loadSohbetler() {
  const sohbetler = await ChatService.getMySohbets();
  ChatStore.setSohbetler(sohbetler);
  renderSohbetList(sohbetler);
}

async function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  
  if (!message) return;
  
  const activeSohbet = ChatStore.getState("activeSohbet");
  if (!activeSohbet) return;
  
  ChatService.sendMessage(activeSohbet._id, message);
  ChatService.stopTyping(activeSohbet._id);
  
  input.value = "";
}

// ==================== UI RENDER ====================

function renderSohbetList(sohbetler) {
  const listEl = document.getElementById("chat-list");
  listEl.innerHTML = "";
  
  sohbetler.forEach((sohbet) => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerHTML = `
      <div class="chat-name">${sohbet.katilimcilar[0]?.name || "Sohbet"}</div>
      <div class="chat-last-message">${sohbet.son_mesaj?.message || "Mesaj yok"}</div>
      ${sohbet.okunmamis_mesaj_sayisi > 0 ? `<span class="badge">${sohbet.okunmamis_mesaj_sayisi}</span>` : ""}
    `;
    
    div.addEventListener("click", () => selectSohbet(sohbet));
    listEl.appendChild(div);
  });
}

async function selectSohbet(sohbet) {
  ChatStore.setActiveSohbet(sohbet);
  ChatService.joinChat(sohbet.sohbet_id);
  
  // Mesajları yükle
  const mesajlar = await ChatService.getMessages(sohbet.sohbet_id);
  ChatStore.setState("messages", {
    ...ChatStore.getState("messages"),
    [sohbet.sohbet_id]: mesajlar,
  });
  
  renderMessages(mesajlar);
  
  // Okundu işaretle
  const mesajIds = mesajlar
    .filter((m) => !m.read_at && m.sender._id !== ChatStore.getState("currentUser")._id)
    .map((m) => m.mesaj_id);
    
  if (mesajIds.length > 0) {
    ChatService.markMessagesAsRead(sohbet.sohbet_id, mesajIds);
  }
}

function renderMessages(mesajlar) {
  const messagesEl = document.getElementById("messages");
  messagesEl.innerHTML = "";
  
  mesajlar.forEach((mesaj) => {
    const div = document.createElement("div");
    div.className = `message ${mesaj.sender._id === ChatStore.getState("currentUser")._id ? "mine" : "theirs"}`;
    div.innerHTML = `
      <div class="message-sender">${mesaj.sender.name}</div>
      <div class="message-content">${mesaj.message}</div>
      <div class="message-time">${formatTime(mesaj.time)}</div>
    `;
    messagesEl.appendChild(div);
  });
  
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateTypingIndicator(data) {
  const indicator = document.getElementById("typing-indicator");
  if (!indicator) return;
  
  if (data.isTyping) {
    indicator.textContent = `${data.user.name} yazıyor...`;
    indicator.style.display = "block";
  } else {
    indicator.style.display = "none";
  }
}

// ==================== BAŞLAT ====================

init();
```

---

## 📊 Özet

### Servis Katmanları

1. **SocketService** → WebSocket bağlantı yönetimi
2. **HTTPService** → REST API istekleri
3. **ChatService** → Business logic (SocketService + HTTPService kullanır)
4. **ChatStore** → State management (opsiyonel)

### Veri Akışı

```
UI ─► ChatService ─► SocketService ─► Backend (WebSocket)
                  └─► HTTPService ─► Backend (HTTP)

Backend ─► SocketService ─► ChatService ─► Event Callbacks ─► UI Update
```

### Avantajlar

- ✅ Framework bağımsız
- ✅ Temiz mimari (separation of concerns)
- ✅ WebSocket + HTTP fallback
- ✅ Event-driven architecture
- ✅ Kolay test edilebilir
- ✅ Ölçeklenebilir

---

Başka soru veya özelleştirme isterseniz söyleyin! 🚀

