module.exports = function authorizePage(pageId) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Giriş yapılmamış." });

    // Süper admin her şeye erişebilir
    if (user.role === 'superadmin') return next();

    if (user.pageAccess?.includes(pageId)) {
      return next();
    }

    return res.status(403).json({ error: "Bu sayfaya erişim yetkiniz yok." });
  };
};
