module.exports = (req, res, next) => {
  if (req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ error: 'Yalnızca süper admin kullanıcılar erişebilir.' });
};