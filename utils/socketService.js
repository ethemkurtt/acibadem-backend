const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { getRedisClient } = require("./cacheService");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Mesaj = require("../models/Mesaj");
const Sohbet = require("../models/Sohbet");
const SohbetKisileri = require("../models/SohbetKisileri");

let io = null;
const onlineUsers = new Map(); // userId -> { socketId, user_data }

/**
 * Socket.IO sunucusunu başlat
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 🔥 Redis Adapter (horizontal scaling için)
  try {
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isReady) {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          console.log("✅ Socket.IO Redis Adapter bağlandı");
        })
        .catch((err) => {
          console.warn("⚠️ Socket.IO Redis Adapter başarısız, fallback mode:", err.message);
        });
    }
  } catch (err) {
    console.warn("⚠️ Socket.IO Redis Adapter kullanılamıyor:", err.message);
  }

  // ✅ Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: Token bulunamadı"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id name email role");

      if (!user) {
        return next(new Error("Authentication error: Kullanıcı bulunamadı"));
      }

      socket.userId = user._id.toString();
      socket.userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      console.error("❌ Socket authentication hatası:", err.message);
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  // ✅ Connection handler
  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`✅ Kullanıcı bağlandı: ${socket.userData.name} (${userId})`);

    // Online kullanıcıları takip et
    onlineUsers.set(userId, {
      socketId: socket.id,
      user: socket.userData,
      connectedAt: new Date(),
    });

    // Kullanıcının sohbetlerine katıl
    joinUserRooms(socket);

    // Kullanıcının online olduğunu bildir
    socket.broadcast.emit("user:online", {
      userId,
      user: socket.userData,
      timestamp: new Date(),
    });

    // ✅ Sohbet odalarına katıl
    socket.on("chat:join", async (data) => {
      try {
        const { sohbet_id } = data;

        // Kullanıcının bu sohbete erişimi var mı kontrol et
        const sohbetKisi = await SohbetKisileri.findOne({
          sohbet_id,
          user_id: userId,
        });

        if (!sohbetKisi) {
          return socket.emit("error", {
            message: "Bu sohbete erişim yetkiniz yok.",
          });
        }

        socket.join(`sohbet:${sohbet_id}`);
        console.log(`👤 ${socket.userData.name} sohbete katıldı: ${sohbet_id}`);

        socket.emit("chat:joined", {
          sohbet_id,
          message: "Sohbete başarıyla katıldınız.",
        });
      } catch (err) {
        console.error("❌ Sohbete katılma hatası:", err);
        socket.emit("error", { message: err.message });
      }
    });

    // ✅ Mesaj gönder
    socket.on("message:send", async (data) => {
      try {
        const { sohbet_id, message } = data;

        if (!message || message.trim().length === 0) {
          return socket.emit("error", { message: "Mesaj boş olamaz." });
        }

        // Kullanıcının bu sohbete erişimi var mı kontrol et
        const sohbetKisi = await SohbetKisileri.findOne({
          sohbet_id,
          user_id: userId,
        });

        if (!sohbetKisi) {
          return socket.emit("error", {
            message: "Bu sohbete mesaj gönderme yetkiniz yok.",
          });
        }

        // Mesajı kaydet
        const yeniMesaj = await Mesaj.create({
          sohbet_id,
          user_id: userId,
          message: message.trim(),
          time: new Date(),
        });

        // Response objesi
        const mesajResponse = {
          _id: yeniMesaj._id,
          mesaj_id: yeniMesaj.mesaj_id,
          sohbet_id,
          message: yeniMesaj.message,
          time: yeniMesaj.time,
          read_at: null,
          sender: socket.userData,
        };

        // Sohbetteki herkese mesajı gönder (gönderen dahil)
        io.to(`sohbet:${sohbet_id}`).emit("message:new", mesajResponse);

        // Sohbetteki diğer katılımcılara bildirim gönder
        const katilimcilar = await SohbetKisileri.find({ sohbet_id }).lean();
        for (const katilimci of katilimcilar) {
          const katilimciId = katilimci.user_id.toString();
          if (katilimciId !== userId) {
            // Online kullanıcıya bildirim gönder
            const onlineUser = onlineUsers.get(katilimciId);
            if (onlineUser) {
              io.to(onlineUser.socketId).emit("notification:new_message", {
                sohbet_id,
                message: mesajResponse,
                notification: {
                  title: `${socket.userData.name} yeni mesaj gönderdi`,
                  body: message.substring(0, 100),
                  timestamp: new Date(),
                },
              });
            }
          }
        }

        console.log(`💬 Mesaj gönderildi: ${socket.userData.name} -> ${sohbet_id}`);
      } catch (err) {
        console.error("❌ Mesaj gönderme hatası:", err);
        socket.emit("error", { message: err.message });
      }
    });

    // ✅ Yazıyor... göstergesi
    socket.on("typing:start", async (data) => {
      try {
        const { sohbet_id } = data;

        // Sohbetteki diğer kullanıcılara bildir
        socket.to(`sohbet:${sohbet_id}`).emit("typing:user", {
          sohbet_id,
          user: socket.userData,
          isTyping: true,
        });
      } catch (err) {
        console.error("❌ Typing start hatası:", err);
      }
    });

    socket.on("typing:stop", async (data) => {
      try {
        const { sohbet_id } = data;

        socket.to(`sohbet:${sohbet_id}`).emit("typing:user", {
          sohbet_id,
          user: socket.userData,
          isTyping: false,
        });
      } catch (err) {
        console.error("❌ Typing stop hatası:", err);
      }
    });

    // ✅ Mesajları okundu olarak işaretle
    socket.on("message:read", async (data) => {
      try {
        const { sohbet_id, mesaj_ids } = data;

        if (!Array.isArray(mesaj_ids) || mesaj_ids.length === 0) {
          return socket.emit("error", { message: "Mesaj ID'leri gerekli." });
        }

        // Mesajları okundu olarak işaretle
        await Mesaj.updateMany(
          {
            _id: { $in: mesaj_ids },
            sohbet_id,
            user_id: { $ne: userId },
          },
          {
            read_at: new Date(),
            okunma_tarihi: new Date(),
          }
        );

        // Sohbetteki herkese bildir
        io.to(`sohbet:${sohbet_id}`).emit("message:read_by", {
          sohbet_id,
          mesaj_ids,
          read_by: socket.userData,
          read_at: new Date(),
        });

        console.log(`✅ Mesajlar okundu: ${mesaj_ids.length} mesaj`);
      } catch (err) {
        console.error("❌ Mesaj okundu işaretleme hatası:", err);
        socket.emit("error", { message: err.message });
      }
    });

    // ✅ Online kullanıcıları getir
    socket.on("users:get_online", () => {
      try {
        const onlineUsersList = Array.from(onlineUsers.values()).map((data) => ({
          userId: data.user._id,
          user: data.user,
          connectedAt: data.connectedAt,
        }));

        socket.emit("users:online_list", {
          users: onlineUsersList,
          count: onlineUsersList.length,
        });
      } catch (err) {
        console.error("❌ Online kullanıcılar getirme hatası:", err);
        socket.emit("error", { message: err.message });
      }
    });

    // ✅ Disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`❌ Kullanıcı ayrıldı: ${socket.userData.name} (${reason})`);

      // Online listesinden çıkar
      onlineUsers.delete(userId);

      // Herkese offline olduğunu bildir
      socket.broadcast.emit("user:offline", {
        userId,
        user: socket.userData,
        timestamp: new Date(),
        reason,
      });
    });

    // ✅ Error handler
    socket.on("error", (err) => {
      console.error("❌ Socket hatası:", err);
    });
  });

  return io;
};

/**
 * Kullanıcının tüm sohbet odalarına otomatik katıl
 */
const joinUserRooms = async (socket) => {
  try {
    const userId = socket.userId;

    // Kullanıcının katıldığı sohbetleri bul
    const sohbetKisileri = await SohbetKisileri.find({ user_id: userId }).lean();

    for (const sk of sohbetKisileri) {
      socket.join(`sohbet:${sk.sohbet_id}`);
    }

    console.log(`✅ Kullanıcı ${sohbetKisileri.length} sohbet odasına katıldı`);
  } catch (err) {
    console.error("❌ Sohbet odalarına katılma hatası:", err);
  }
};

/**
 * Socket.IO instance'ını al
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO henüz başlatılmadı!");
  }
  return io;
};

/**
 * Online kullanıcı sayısını al
 */
const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

/**
 * Kullanıcının online olup olmadığını kontrol et
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

/**
 * Belirli bir kullanıcıya bildirim gönder
 */
const sendNotificationToUser = (userId, event, data) => {
  try {
    const onlineUser = onlineUsers.get(userId.toString());
    if (onlineUser && io) {
      io.to(onlineUser.socketId).emit(event, data);
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ Bildirim gönderme hatası:", err);
    return false;
  }
};

/**
 * Sohbet odasına mesaj gönder
 */
const sendMessageToRoom = (sohbet_id, event, data) => {
  try {
    if (io) {
      io.to(`sohbet:${sohbet_id}`).emit(event, data);
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ Sohbet odasına mesaj gönderme hatası:", err);
    return false;
  }
};

module.exports = {
  initializeSocket,
  getIO,
  getOnlineUsersCount,
  isUserOnline,
  sendNotificationToUser,
  sendMessageToRoom,
};

