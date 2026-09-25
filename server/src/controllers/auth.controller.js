const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function register(req, res, next) {
  try {
    const { firstName, lastName, email, password, role, city } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role,
      city,
    });

    const token = createToken(user.id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect.",
      });
    }

    const token = createToken(user.id);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    return next(error);
  }
}

function getCurrentUser(req, res) {
  return res.json({
    success: true,
    user: req.user.toPublicJSON(),
  });
}

module.exports = { getCurrentUser, login, register };

