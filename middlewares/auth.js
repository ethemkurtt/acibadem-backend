const jwt = require("jsonwebtoken");

module.exports.authenticate = (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.sendStatus(401);
  }
};