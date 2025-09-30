const axios = require("axios");
const https = require("https");

// Lazy loading ile token kontrolü - sadece kullanıldığında kontrol et
function createMobilizAxios() {
  const token = process.env.MOBILIZ_TOKEN;
  
  if (!token) {
    console.warn("⚠️ MOBILIZ_TOKEN environment variable is missing!");
    
    // Production'da geçici fallback (güvenlik riski - sadece acil durum için)
    if (process.env.NODE_ENV === 'production') {
      console.warn("🚨 Using fallback token for production - SECURITY RISK!");
      console.warn("🔒 Please set MOBILIZ_TOKEN environment variable immediately!");
    }
    
    // Fallback token (eski hardcoded token - sadece acil durum için)
    const fallbackToken = "43afc4b4fb2025ed2b29e4ca48705191e1584e7fcfeb1f276abe4b848f8614bc";
    
    return axios.create({
      baseURL: process.env.MOBILIZ_BASE_URL || "https://ng.mobiliz.com.tr/su5/api/integrations",
      headers: {
        "Mobiliz-Token": fallbackToken,
      },
      httpsAgent: new https.Agent({ keepAlive: false }),
    });
  }

  return axios.create({
    baseURL: process.env.MOBILIZ_BASE_URL || "https://ng.mobiliz.com.tr/su5/api/integrations",
    headers: {
      "Mobiliz-Token": token,
    },
    httpsAgent: new https.Agent({ keepAlive: false }), // 🔥 Mobiliz için bu çok önemli
  });
}

// Proxy ile lazy loading
const mobilizAxios = new Proxy({}, {
  get(target, prop) {
    const instance = createMobilizAxios();
    return instance[prop];
  }
});

module.exports = mobilizAxios;
