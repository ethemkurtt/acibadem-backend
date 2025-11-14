# 🎨 Frontend Chat Sistemi - Cursor AI Prompt

## 📋 Görev Tanımı

Backend'de Socket.IO tabanlı gerçek zamanlı chat sistemi hazır. Şimdi React/Next.js kullanarak modern, responsive bir chat arayüzü geliştir.

---

## 🎯 Gereksinimler

### 1. Teknoloji Stack
- **Framework**: React 18+ veya Next.js 14+
- **WebSocket**: socket.io-client
- **State Management**: Zustand veya React Context
- **UI Library**: Tailwind CSS + Shadcn/UI (veya MUI)
- **Icons**: Lucide React
- **Date**: date-fns veya dayjs
- **Notifications**: react-hot-toast

### 2. Temel Özellikler
- ✅ Gerçek zamanlı mesajlaşma
- ✅ Online/Offline göstergesi
- ✅ Okunmamış mesaj sayısı
- ✅ "Yazıyor..." göstergesi
- ✅ Mesaj okundu tikleri
- ✅ Browser bildirimleri
- ✅ Emoji picker
- ✅ Mesaj arama
- ✅ Infinite scroll (pagination)
- ✅ Responsive design (mobile-first)

---

## 📦 Gerekli Paketler

```bash
npm install socket.io-client zustand date-fns react-hot-toast lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install emoji-picker-react react-virtualized-auto-sizer react-window
```

---

## 🏗️ Proje Yapısı

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatLayout.tsx           # Ana chat container
│   │   ├── ChatSidebar.tsx          # Sohbet listesi
│   │   ├── ChatWindow.tsx           # Mesaj penceresi
│   │   ├── MessageInput.tsx         # Mesaj gönderme input
│   │   ├── MessageList.tsx          # Mesaj listesi (virtualized)
│   │   ├── MessageItem.tsx          # Tek mesaj component
│   │   ├── TypingIndicator.tsx      # "Yazıyor..." göstergesi
│   │   ├── OnlineIndicator.tsx      # Online/offline badge
│   │   ├── EmojiPicker.tsx          # Emoji seçici
│   │   └── NewChatDialog.tsx        # Yeni sohbet başlatma modal
│   └── notifications/
│       └── NotificationBell.tsx     # Bildirim ikonu + badge
├── hooks/
│   ├── useSocket.ts                 # Socket.IO custom hook
│   ├── useChat.ts                   # Chat işlemleri hook
│   └── useNotifications.ts          # Browser notification hook
├── stores/
│   ├── chatStore.ts                 # Zustand chat store
│   └── socketStore.ts               # Zustand socket store
├── services/
│   ├── socketService.ts             # Socket.IO service
│   └── chatAPI.ts                   # HTTP API calls
├── types/
│   └── chat.types.ts                # TypeScript types
└── utils/
    ├── formatDate.ts                # Tarih formatlama
    └── soundNotification.ts         # Ses bildirimi
```

---

## 🔌 Socket.IO Integration

### 1. Socket Service (`services/socketService.ts`)

```typescript
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket bağlandı:", this.socket?.id);
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket bağlantı hatası:", err.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket bağlantısı kesildi:", reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export default new SocketService();
```

---

### 2. Chat Store (`stores/chatStore.ts`)

```typescript
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface User {
  _id: string;
  name: string;
  email: string;
  isOnline?: boolean;
}

interface Message {
  _id: string;
  mesaj_id: string;
  message: string;
  time: string;
  read_at: string | null;
  sender: User;
}

interface Sohbet {
  sohbet_id: string;
  sohbet_tipi?: string;
  katilimcilar: User[];
  son_mesaj: Message | null;
  okunmamis_mesaj_sayisi: number;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  // Sohbetler
  sohbetler: Sohbet[];
  activeSohbet: Sohbet | null;
  
  // Mesajlar
  messages: Record<string, Message[]>; // sohbet_id -> Message[]
  
  // Online kullanıcılar
  onlineUsers: Set<string>;
  
  // Typing indicators
  typingUsers: Record<string, User[]>; // sohbet_id -> User[]
  
  // UI State
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  
  // Actions
  setSohbetler: (sohbetler: Sohbet[]) => void;
  setActiveSohbet: (sohbet: Sohbet | null) => void;
  addSohbet: (sohbet: Sohbet) => void;
  removeSohbet: (sohbet_id: string) => void;
  
  setMessages: (sohbet_id: string, messages: Message[]) => void;
  addMessage: (sohbet_id: string, message: Message) => void;
  prependMessages: (sohbet_id: string, messages: Message[]) => void;
  markMessagesAsRead: (sohbet_id: string, mesaj_ids: string[]) => void;
  
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  
  addTypingUser: (sohbet_id: string, user: User) => void;
  removeTypingUser: (sohbet_id: string, userId: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        sohbetler: [],
        activeSohbet: null,
        messages: {},
        onlineUsers: new Set(),
        typingUsers: {},
        isLoadingMessages: false,
        hasMoreMessages: true,

        setSohbetler: (sohbetler) => set({ sohbetler }),
        
        setActiveSohbet: (sohbet) => set({ activeSohbet: sohbet }),
        
        addSohbet: (sohbet) =>
          set((state) => ({
            sohbetler: [sohbet, ...state.sohbetler],
          })),
        
        removeSohbet: (sohbet_id) =>
          set((state) => ({
            sohbetler: state.sohbetler.filter((s) => s.sohbet_id !== sohbet_id),
          })),

        setMessages: (sohbet_id, messages) =>
          set((state) => ({
            messages: { ...state.messages, [sohbet_id]: messages },
          })),

        addMessage: (sohbet_id, message) =>
          set((state) => {
            const currentMessages = state.messages[sohbet_id] || [];
            return {
              messages: {
                ...state.messages,
                [sohbet_id]: [...currentMessages, message],
              },
            };
          }),

        prependMessages: (sohbet_id, messages) =>
          set((state) => {
            const currentMessages = state.messages[sohbet_id] || [];
            return {
              messages: {
                ...state.messages,
                [sohbet_id]: [...messages, ...currentMessages],
              },
            };
          }),

        markMessagesAsRead: (sohbet_id, mesaj_ids) =>
          set((state) => {
            const currentMessages = state.messages[sohbet_id] || [];
            const updatedMessages = currentMessages.map((msg) =>
              mesaj_ids.includes(msg.mesaj_id)
                ? { ...msg, read_at: new Date().toISOString() }
                : msg
            );
            return {
              messages: { ...state.messages, [sohbet_id]: updatedMessages },
            };
          }),

        setUserOnline: (userId) =>
          set((state) => {
            const newSet = new Set(state.onlineUsers);
            newSet.add(userId);
            return { onlineUsers: newSet };
          }),

        setUserOffline: (userId) =>
          set((state) => {
            const newSet = new Set(state.onlineUsers);
            newSet.delete(userId);
            return { onlineUsers: newSet };
          }),

        addTypingUser: (sohbet_id, user) =>
          set((state) => {
            const current = state.typingUsers[sohbet_id] || [];
            if (current.some((u) => u._id === user._id)) return state;
            return {
              typingUsers: {
                ...state.typingUsers,
                [sohbet_id]: [...current, user],
              },
            };
          }),

        removeTypingUser: (sohbet_id, userId) =>
          set((state) => {
            const current = state.typingUsers[sohbet_id] || [];
            return {
              typingUsers: {
                ...state.typingUsers,
                [sohbet_id]: current.filter((u) => u._id !== userId),
              },
            };
          }),
      }),
      {
        name: "chat-storage",
        partialize: (state) => ({
          // Sadece sohbet listesini persist et
          sohbetler: state.sohbetler,
        }),
      }
    )
  )
);
```

---

### 3. useSocket Hook (`hooks/useSocket.ts`)

```typescript
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import socketService from "@/services/socketService";
import { useChatStore } from "@/stores/chatStore";
import { toast } from "react-hot-toast";

export const useSocket = (token: string | null) => {
  const router = useRouter();
  const {
    addMessage,
    setUserOnline,
    setUserOffline,
    addTypingUser,
    removeTypingUser,
    markMessagesAsRead,
  } = useChatStore();

  useEffect(() => {
    if (!token) return;

    // Socket bağlantısını başlat
    const socket = socketService.connect(token);

    // ✅ Yeni mesaj
    socket.on("message:new", (data) => {
      console.log("📨 Yeni mesaj:", data);
      addMessage(data.sohbet_id, data);
      
      // Ses bildirimi çal
      playNotificationSound();
    });

    // ✅ Bildirim
    socket.on("notification:new_message", (data) => {
      console.log("🔔 Yeni mesaj bildirimi:", data);
      toast.success(data.notification.title, {
        description: data.notification.body,
      });

      // Browser notification
      showBrowserNotification(data.notification);
    });

    // ✅ Online/Offline
    socket.on("user:online", (data) => {
      console.log("🟢 Kullanıcı online:", data.user.name);
      setUserOnline(data.userId);
    });

    socket.on("user:offline", (data) => {
      console.log("🔴 Kullanıcı offline:", data.user.name);
      setUserOffline(data.userId);
    });

    // ✅ Typing indicator
    socket.on("typing:user", (data) => {
      if (data.isTyping) {
        addTypingUser(data.sohbet_id, data.user);
        
        // 3 saniye sonra otomatik kaldır
        setTimeout(() => {
          removeTypingUser(data.sohbet_id, data.user._id);
        }, 3000);
      } else {
        removeTypingUser(data.sohbet_id, data.user._id);
      }
    });

    // ✅ Mesajlar okundu
    socket.on("message:read_by", (data) => {
      console.log("✅ Mesajlar okundu:", data);
      markMessagesAsRead(data.sohbet_id, data.mesaj_ids);
    });

    // ✅ Sohbet silindi
    socket.on("sohbet:deleted", (data) => {
      console.log("🗑️ Sohbet silindi:", data);
      toast.error("Sohbet başlatan tarafından silindi.");
      // Sohbet listesine yönlendir
      router.push("/chat");
    });

    // ✅ Error
    socket.on("error", (data) => {
      console.error("❌ Socket hatası:", data);
      toast.error(data.message);
    });

    // Cleanup
    return () => {
      socket.off("message:new");
      socket.off("notification:new_message");
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("typing:user");
      socket.off("message:read_by");
      socket.off("sohbet:deleted");
      socket.off("error");
    };
  }, [token]);

  return socketService.getSocket();
};

// Yardımcı fonksiyonlar
function playNotificationSound() {
  const audio = new Audio("/sounds/notification.mp3");
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

function showBrowserNotification(notification: { title: string; body: string }) {
  if (Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.body,
      icon: "/logo.png",
      badge: "/logo.png",
    });
  }
}
```

---

## 🎨 UI Components

### 1. ChatLayout Component

```tsx
"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore } from "@/stores/chatStore";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { useAuth } from "@/hooks/useAuth"; // JWT token için

export function ChatLayout() {
  const { token } = useAuth();
  const socket = useSocket(token);
  const { activeSohbet } = useChatStore();

  // Browser notification izni iste
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sol: Sohbet Listesi */}
      <ChatSidebar />

      {/* Sağ: Mesaj Penceresi */}
      {activeSohbet ? (
        <ChatWindow sohbet={activeSohbet} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Bir sohbet seçin</p>
        </div>
      )}
    </div>
  );
}
```

---

### 2. MessageInput Component (Typing Indicator ile)

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import socketService from "@/services/socketService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "./EmojiPicker";

interface MessageInputProps {
  sohbet_id: string;
}

export function MessageInput({ sohbet_id }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Yazıyor göstergesini gönder
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.emit("typing:start", { sohbet_id });
    }

    // Debounce: 2 saniye sonra "yazmayı bıraktı" gönder
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emit("typing:stop", { sohbet_id });
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    socketService.emit("message:send", {
      sohbet_id,
      message: message.trim(),
    });

    setMessage("");
    setIsTyping(false);
    socketService.emit("typing:stop", { sohbet_id });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        {/* Emoji Picker */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => {
                setMessage((prev) => prev + emoji);
                setShowEmoji(false);
              }}
            />
          )}
        </div>

        {/* Mesaj Input */}
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
        />

        {/* Gönder Butonu */}
        <Button onClick={handleSend} disabled={!message.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 3. TypingIndicator Component

```tsx
"use client";

import { useChatStore } from "@/stores/chatStore";

interface TypingIndicatorProps {
  sohbet_id: string;
}

export function TypingIndicator({ sohbet_id }: TypingIndicatorProps) {
  const { typingUsers } = useChatStore();
  const users = typingUsers[sohbet_id] || [];

  if (users.length === 0) return null;

  const names = users.map((u) => u.name).join(", ");

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      <span className="inline-flex items-center gap-1">
        {names} yazıyor
        <span className="flex gap-1">
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
        </span>
      </span>
    </div>
  );
}
```

---

## 📱 Responsive Design

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
    },
  },
}
```

### Mobile Layout
- Mobilde: Sohbet listesi veya mesaj penceresi (toggle)
- Desktop: Yan yana split view
- Tablet: Split view ama dar sidebar

```tsx
// Responsive toggle
const [showSidebar, setShowSidebar] = useState(false);

<div className="md:hidden"> {/* Mobil menü butonu */}
  <Button onClick={() => setShowSidebar(!showSidebar)}>
    <Menu />
  </Button>
</div>
```

---

## 🔔 Browser Notifications

```typescript
// hooks/useNotifications.ts
export const useNotifications = () => {
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.warn("Browser bildirimleri desteklenmiyor");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/logo.png",
        badge: "/logo.png",
        ...options,
      });
    }
  };

  return { requestPermission, showNotification };
};
```

---

## ⚡ Performance Optimizations

### 1. Virtual Scrolling (react-window)
Binlerce mesaj için performans:

```tsx
import { FixedSizeList } from "react-window";

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <MessageItem message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### 2. Debounce Typing
```typescript
import { debounce } from "lodash";

const handleTypingDebounced = debounce(() => {
  socketService.emit("typing:start", { sohbet_id });
}, 300);
```

### 3. Memoization
```tsx
import { memo } from "react";

export const MessageItem = memo(({ message }) => {
  // ...
});
```

---

## 🎨 UI/UX Best Practices

1. **Loading States**: Skeleton loaders
2. **Empty States**: Güzel boş durum görselleri
3. **Error States**: Retry butonları
4. **Optimistic Updates**: Mesaj gönderince hemen göster
5. **Smooth Animations**: Framer Motion
6. **Dark Mode**: System preference'a göre
7. **Accessibility**: ARIA labels, keyboard navigation
8. **PWA Support**: Offline mode, install prompt

---

## 🚀 Deployment

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Chat App
```

### Build & Deploy
```bash
npm run build
npm run start
```

---

## ✅ Checklist

- [ ] Socket.IO client entegrasyonu
- [ ] Zustand store kurulumu
- [ ] Chat layout (sidebar + window)
- [ ] Mesaj gönderme/alma
- [ ] Typing indicators
- [ ] Online/offline göstergeleri
- [ ] Browser notifications
- [ ] Emoji picker
- [ ] Mesaj arama
- [ ] Infinite scroll
- [ ] Responsive design
- [ ] Dark mode
- [ ] Error handling
- [ ] Loading states
- [ ] Unit tests
- [ ] E2E tests (Playwright)

---

## 🎯 Cursor'a Özel Talimatlar

1. **Adım 1**: Socket service ve store dosyalarını oluştur
2. **Adım 2**: useSocket hook'unu implement et
3. **Adım 3**: ChatLayout, ChatSidebar, ChatWindow component'lerini oluştur
4. **Adım 4**: MessageInput ve MessageList component'lerini oluştur
5. **Adım 5**: Typing indicator ve online göstergelerini ekle
6. **Adım 6**: Browser notification entegrasyonu
7. **Adım 7**: Responsive design ve styling
8. **Adım 8**: Testing ve debugging

---

## 📚 Referanslar

- Backend API Dokümantasyonu: `CHAT_SYSTEM_DOCUMENTATION.md`
- Socket.IO Events: Yukarıdaki dokümantasyonda detaylı
- TypeScript Types: `chat.types.ts` dosyasında tanımla

---

**Not**: Tüm component'leri TypeScript ile yaz, Tailwind CSS kullan, ve Shadcn/UI component library'sini tercih et.

Başarılar! 🚀

