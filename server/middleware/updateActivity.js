const db = require("../config/database");

module.exports = async (req, res, next) => {
  try {
    if (req.userId) {
      await db.execute(
        "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?",
        [req.userId]
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
