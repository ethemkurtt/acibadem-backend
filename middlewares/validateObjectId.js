// middlewares/validateObjectId.js
const { Types } = require("mongoose");

module.exports = function validateObjectId(paramName = "id") {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!Types.ObjectId.isValid(val)) {
      return res.status(400).json({ ok: false, message: `Geçersiz ${paramName}` });
    }
    next();
  };
};
