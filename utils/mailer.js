// utils/mailer.js
const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("[mailer] SMTP env değişkenlerini kontrol edin.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 465),
  secure: String(SMTP_SECURE || "true") === "true", // 465 -> true, 587 -> false
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Hostinger bazen TLS sürümünde sıkı davranabilir:
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
  // bağlantıyı biraz daha sabit tutmak için:
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
});

// Basit bir retry wrapper (ör. transient hatalarda tekrar dene)
async function sendMail({ to, subject, html, text, from }) {
  const mailOptions = {
    from: from || `"${MAIL_FROM_NAME || "No-Reply"}" <${MAIL_FROM_EMAIL || SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  let lastErr;
  for (let i = 0; i < 2; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      lastErr = err;
      // 4xx/connection hatalarında bir kez daha dene
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw lastErr;
}

// Sağlık kontrolü (opsiyonel – başlangıçta bir kez çağırabilirsin)
async function verifyTransport() {
  try {
    await transporter.verify();
    console.log("[mailer] SMTP ready.");
  } catch (e) {
    console.error("[mailer] verify error:", e?.message || e);
  }
}

module.exports = { sendMail, verifyTransport };
