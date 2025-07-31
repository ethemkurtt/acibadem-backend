const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const app = express();

// Çevresel değişkenleri yükle (.env'den)
dotenv.config();

// Middleware'ler
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
const personelTalepRoutes = require("./routes/personelTalep.route");
// Statik dosyalar (örneğin resimler)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔗 Route'lar
const otelRoutes = require("./routes/otel.routes");
const hastaTalepRoutes = require("./routes/hastaTalep.routes");
const departmanRoutes = require("./routes/departman.routes");
app.use("/api/otel", otelRoutes); // → /api/otel/...
app.use("/api/hasta-talep", hastaTalepRoutes); // → /api/hasta-talep/...
const havalimaniRoutes = require("./routes/havalimani.routes");
app.use("/api/havalimani", havalimaniRoutes);
const hastaneRoutes = require("./routes/hastane.routes");
app.use("/api/hastane", hastaneRoutes);
const lokasyonRoutes = require("./routes/lokasyon.routes");
app.use("/api/lokasyon", lokasyonRoutes);
const ulkeRoutes = require("./routes/ulke.routes");
app.use("/api/ulke", ulkeRoutes);
app.use("/api/personel-talep", personelTalepRoutes);
const authRoutes = require("./routes/auth.route");
app.use("/api", authRoutes);
const vehicleRoutes = require("./routes/vehicle.routes");
const userRoutes = require("./routes/auth.route");
const roomRoutes = require("./routes/room.route");
app.use("/api/rooms", roomRoutes);
app.use("/api", userRoutes);
// JSON parse middleware
app.use("/api/departman", departmanRoutes);
const roleRoutes = require("./routes/role.routes");
app.use("/api/roles", roleRoutes);
app.use(express.json());
const bolgeUlkeRoutes = require("./routes/bolgeUlke.routes");
app.use("/api", bolgeUlkeRoutes);
// Route tanımı
app.use("/api/vehicles", vehicleRoutes);
// 🧠 MongoDB Bağlantısı
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// 🚀 Sunucu Başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));
