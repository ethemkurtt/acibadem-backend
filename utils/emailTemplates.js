// utils/emailTemplates.js

const brand = {
  appName: "Acıbadem Portal",
};

function layout({ title, body }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <div style="text-align:center;margin-bottom:16px">
      <strong style="font-size:18px">${brand.appName}</strong>
    </div>
    <h2 style="font-size:20px;margin:0 0 12px">${title}</h2>
    <div style="font-size:14px;line-height:1.6">${body}</div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    <div style="font-size:12px;color:#666">Bu e-posta otomatik gönderildi. Siz talep etmediyseniz görmezden gelebilirsiniz.</div>
  </div>
  `;
}

function resetPasswordEmail({ resetUrl, expiresText = "1 saat" }) {
  const title = "Şifre Sıfırlama";
  const body = `
    <p>Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın. Bağlantı <b>${expiresText}</b> geçerlidir.</p>
    <p style="margin:20px 0">
      <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Şifreyi Sıfırla</a>
    </p>
    <p style="word-break:break-all;color:#555">${resetUrl}</p>
  `;
  return layout({ title, body });
}

module.exports = {
  resetPasswordEmail,
};
