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

// const digerTalepRoutes = require("./routes/digerTalep.routes");
// Statik dosyalar (örneğin resimler)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/api/diger-talep", digerTalepRoutes);
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
const ucakTalepRoutes = require("./routes/ucakTalep.routes");
app.use("/api/seyahat/ucak-talepler", ucakTalepRoutes);
app.use("/api/otel-talep", require("./routes/otelTalep.routes"));
const digerUlasimRoutes = require("./routes/digerUlasim.routes");
app.use("/api/seyahat/diger-ulasim-talepler", digerUlasimRoutes);
const vizeRoutes = require("./routes/vize.routes");
app.use("/api/seyahat/vize-talepler", vizeRoutes);
const temsilRoutes = require("./routes/temsil.routes");
app.use("/api/seyahat/temsil-talepler", temsilRoutes);
const digerRoutes = require("./routes/diger.routes");
app.use("/api/seyahat/diger-talepler", digerRoutes);
const talepTipiRoutes = require("./routes/talepTipi.routes");
app.use("/api/talep-tipleri", talepTipiRoutes);
const misafirTalepRoutes = require("./routes/misafirTalep.routes");
app.use("/api/misafir-talep", misafirTalepRoutes);
app.use("/api/me", require("./routes/me.routes"));
const roleGroupRoutes = require("./routes/roleGroup.route");
app.use("/api", roleGroupRoutes); // <-- EKLENDİ
const sehirlerRouter = require("./routes/sehirler");
app.use("/api/sehirler", sehirlerRouter);
// 🧠 MongoDB Bağlantısı
const plakalarRouter = require("./routes/plakalar");
app.use("/api/plakalar", plakalarRouter);
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
