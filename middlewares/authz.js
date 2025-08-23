module.exports.requirePerm = (key) => (req, res, next) => {
  const perms = req.user?.perms || [];
  if (!perms.includes(key)) return res.sendStatus(403);
  next();
};

module.exports.requireRole = (...allowedRoles) => (req, res, next) => {
  const primary = req.user?.role || null; // tekli rol (backward-compat)
  const many = Array.isArray(req.user?.roles) ? req.user.roles : (primary ? [primary] : []);
  const ok = many.some((r) => allowedRoles.includes(r));
  if (!ok) return res.sendStatus(403);
  next();
};