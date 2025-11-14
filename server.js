// server.js  (CommonJS, tek tip)

// ---- Core & 3rd party ----
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

// ---- App ----
const app = express();
const server = http.createServer(app);

// ---- Config ----
dotenv.config();

// ⚡ OPTIMIZE: Cache Service
const cacheService = require("./utils/cacheService");

// ⚡ REAL-TIME: Socket.IO Service
const socketService = require("./utils/socketService");

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Routes (require) ----
const personelTalepRoutes   = require("./routes/personelTalep.route");
const otelRoutes            = require("./routes/otel.routes");
const hastaTalepRoutes      = require("./routes/hastaTalep.routes");
const departmanRoutes       = require("./routes/departman.routes");
const havalimaniRoutes      = require("./routes/havalimani.routes");
const hastaneRoutes         = require("./routes/hastane.routes");
const lokasyonRoutes        = require("./routes/lokasyon.routes");
const ulkeRoutes            = require("./routes/ulke.routes");
const authRoutes            = require("./routes/auth.route");
const vehicleRoutes         = require("./routes/vehicle.routes");
const roomRoutes            = require("./routes/room.route");
const roleRoutes            = require("./routes/role.routes");
const bolgeUlkeRoutes       = require("./routes/bolgeUlke.routes");
const ucakTalepRoutes       = require("./routes/ucakTalep.routes");
const otelTalepRoutes       = require("./routes/otelTalep.routes");
const digerUlasimRoutes     = require("./routes/digerUlasim.routes");
const vizeRoutes            = require("./routes/vize.routes");
const temsilRoutes          = require("./routes/temsil.routes");
const digerRoutes           = require("./routes/diger.routes");
const talepTipiRoutes       = require("./routes/talepTipi.routes");
const misafirTalepRoutes    = require("./routes/misafirTalep.routes");
const meRoutes              = require("./routes/me.routes");
const roleGroupRoutes       = require("./routes/roleGroup.route");
const sehirlerRouter        = require("./routes/sehirler");
const plakalarRouter        = require("./routes/plakalar");
const sohbetRoutes          = require("./routes/sohbet.optimized.routes"); // ⚡ Optimize edilmiş sohbet sistemi

// Yeni eklediklerin:
const taleplerRoutes        = require("./routes/talepler.routes");
const hastaDetayRoutes      = require("./routes/hastaTalepDetay.routes");
const personelDetayRoutes      = require("./routes/personelTalepDetay.routes");
const misafirDetayRoutes      = require("./routes/misafirTalepDetay.routes");
const digerDetayRoutes      = require("./routes/digerTalepDetay.routes");
const takvimRoutes      = require("./routes/takvim.routes");

// ---- Route mounts ----
// /api kökü
app.use("/api", authRoutes);               // login/register vb.
app.use("/api/otel", otelRoutes);
app.use("/api/hasta-talep", hastaTalepRoutes);
app.use("/api/havalimani", havalimaniRoutes);
app.use("/api/hastane", hastaneRoutes);
app.use("/api/lokasyon", lokasyonRoutes);
app.use("/api/ulke", ulkeRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/departman", departmanRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api", bolgeUlkeRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/seyahat/ucak-talepler", ucakTalepRoutes);
app.use("/api/otel-talep", otelTalepRoutes);
app.use("/api/seyahat/diger-ulasim-talepler", digerUlasimRoutes);
app.use("/api/seyahat/vize-talepler", vizeRoutes);
app.use("/api/seyahat/temsil-talepler", temsilRoutes);
app.use("/api/seyahat/diger-talepler", digerRoutes);
app.use("/api/talep-tipleri", talepTipiRoutes);
app.use("/api/misafir-talep", misafirTalepRoutes);
app.use("/api/me", meRoutes);
app.use("/api", roleGroupRoutes);
app.use("/api/sehirler", sehirlerRouter);
app.use("/api/plakalar", plakalarRouter);
app.use("/api/sohbet", sohbetRoutes);
app.use("/api/takvim", takvimRoutes);

// Yeni eklenen endpoint’ler (CJS):
app.use("/api/talepler/", taleplerRoutes);
app.use("/api/hasta-detay", hastaDetayRoutes);
app.use("/api/personel-detay", personelDetayRoutes);
app.use("/api/misafir-detay", misafirDetayRoutes);
app.use("/api/diger-detay", digerDetayRoutes);

// ---- DB ----
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// ⚡ OPTIMIZE: Redis bağlantısı (opsiyonel)
cacheService
  .connect()
  .then(() => {
    if (cacheService.isReady) {
      console.log("⚡ Cache sistemi aktif - Performans optimizasyonu çalışıyor");
    } else {
      console.log("⚠️  Cache sistemi devre dışı - Normal modda çalışıyor");
    }
  })
  .catch((err) => {
    console.warn("⚠️  Cache başlatılamadı, normal modda devam ediliyor:", err.message);
  });

// ⚡ REAL-TIME: Socket.IO başlat
const io = socketService.initializeSocket(server);
console.log("🔌 Socket.IO başlatıldı - Gerçek zamanlı iletişim aktif");

// ---- Server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`⚡ Performans optimizasyonları aktif`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} sinyali alındı, sunucu kapatılıyor...`);
  
  try {
    // Socket.IO bağlantılarını kapat
    if (io) {
      console.log("🔌 Socket.IO bağlantıları kapatılıyor...");
      io.close();
    }
    
    // Redis bağlantısını kapat
    await cacheService.disconnect();
    
    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log("✅ Tüm bağlantılar başarıyla kapatıldı");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Graceful shutdown hatası:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
