const nodemailer = require("nodemailer");

// SMTP bilgilerini gir
let transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",  // örnek: smtp.gmail.com
  port: 465,                // TLS için genelde 587, SSL için 465
  secure: true,            // true = 465, false = diğerleri
  auth: {
    user: "password@arndevelopment.com.tr", // SMTP kullanıcı adı
    pass: "Passw0rd123.?!!?"           // SMTP şifre
  }
});

// Maili gönder
transporter.sendMail({
  from: '"Gönderen Adı" <password@arndevelopment.com.tr>', // Kimden
  to: "ethemkurtt98@gmail.com",              // Kime
  subject: "Test Mail",                   // Konu
  text: "Merhaba, bu test mailidir!"      // Mail içeriği
}, (err, info) => {
  if (err) {
    return console.log("Hata:", err);
  }
  console.log("Mail gönderildi:", info.response);
});
