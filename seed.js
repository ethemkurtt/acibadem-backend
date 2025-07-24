const bcrypt = require("bcryptjs");
const User = require("./models/user.model");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/acibadem");

async function createSuperAdmin() {
  const hashed = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Süper Admin",
    email: "admin@acibadem.com",
    password: hashed,
    role: "superadmin"
  });

  console.log("✅ Süper admin eklendi");
  mongoose.disconnect();
}

createSuperAdmin();
