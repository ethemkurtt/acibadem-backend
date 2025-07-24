const axios = require("axios");
const https = require("https");

const mobilizAxios = axios.create({
  baseURL: "https://ng.mobiliz.com.tr/su5/api/integrations",
  headers: {
    "Mobiliz-Token": "43afc4b4fb2025ed2b29e4ca48705191e1584e7fcfeb1f276abe4b848f8614bc",
  },
  httpsAgent: new https.Agent({ keepAlive: false }), // 🔥 Mobiliz için bu çok önemli
});

module.exports = mobilizAxios;
