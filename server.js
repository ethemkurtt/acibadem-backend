// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const app = express();

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Statik dosyalar
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔗 Route'lar

// Diğer tekil route dosyaları (gerekliyse)
app.use("/api/otel", require("./routes/otel.routes"));
app.use("/api/hasta-talep", require("./routes/hastaTalep.routes"));
app.use("/api/havalimani", require("./routes/havalimani.routes"));
app.use("/api/hastane", require("./routes/hastane.routes"));
app.use("/api/lokasyon", require("./routes/lokasyon.routes"));
app.use("/api/ulke", require("./routes/ulke.routes"));
app.use("/api/personel-talep", require("./routes/personelTalep.route"));
app.use("/api/rooms", require("./routes/room.route"));
app.use("/api/departman", require("./routes/departman.routes"));
app.use("/api/roles", require("./routes/role.routes"));
app.use("/api/seyahat/ucak-talepler", require("./routes/ucakTalep.routes"));
app.use("/api/seyahat/diger-ulasim-talepler", require("./routes/digerUlasim.routes"));
app.use("/api/seyahat/vize-talepler", require("./routes/vize.routes"));
app.use("/api/seyahat/temsil-talepler", require("./routes/temsil.routes"));
app.use("/api/seyahat/diger-talepler", require("./routes/diger.routes"));
app.use("/api/talep-tipleri", require("./routes/talepTipi.routes"));
app.use("/api/misafir-talep", require("./routes/misafirTalep.routes"));
app.use("/api/me", require("./routes/me.routes"));
app.use("/api/sehirler", require("./routes/sehirler"));
app.use("/api/plakalar", require("./routes/plakalar"));
app.use("/api", require("./routes/bolgeUlke.routes"));
app.use("/api", require("./routes/roleGroup.route")); // varsa bu da burada kalabilir

// 🧠 MongoDB bağlantısı
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// 🚀 Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));
