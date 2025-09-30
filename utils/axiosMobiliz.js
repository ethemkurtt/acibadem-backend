const axios = require("axios");
const https = require("https");

const mobilizAxios = axios.create({
  baseURL: process.env.MOBILIZ_BASE_URL || "https://ng.mobiliz.com.tr/su5/api/integrations",
  headers: {
    "Mobiliz-Token": process.env.MOBILIZ_TOKEN,
  },
  httpsAgent: new https.Agent({ keepAlive: false }), // 🔥 Mobiliz için bu çok önemli
});

// Token kontrolü
if (!process.env.MOBILIZ_TOKEN) {
  console.error("❌ MOBILIZ_TOKEN environment variable is required!");
  throw new Error("MOBILIZ_TOKEN environment variable is required");
}

module.exports = mobilizAxios;
