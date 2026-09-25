const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const token = authorization.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user connected to this token no longer exists.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid or has expired.",
      });
    }

    return next(error);
  }
}

module.exports = { requireAuth };

