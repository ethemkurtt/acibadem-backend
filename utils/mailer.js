// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // 465 → true
  auth: {
    user: "password@arndevelopment.com.tr",   // senin mail adresin
    pass: "Passw0rd123..!!?",                  // senin mail şifren
  },
});

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: '"Acıbadem Sistem" <password@arndevelopment.com.tr>',
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
