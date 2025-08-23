// middlewares/authz.js
module.exports.requirePerm = (key) => (req, res, next) => {
  const perms = req.user?.perms || [];
  if (!perms.includes(key)) return res.sendStatus(403);
  next();
};
