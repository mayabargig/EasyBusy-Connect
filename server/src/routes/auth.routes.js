const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const {
  getCurrentUser,
  login,
  register,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("First name must contain 2-40 characters."),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("Last name must contain 2-40 characters."),
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("password")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must contain 8-72 characters.")
    .matches(/[a-z]/)
    .withMessage("Password must include a lowercase letter.")
    .matches(/[A-Z]/)
    .withMessage("Password must include an uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must include a number."),
  body("role")
    .optional()
    .isIn(["customer", "business_owner"])
    .withMessage("Select a valid account type."),
  body("city")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("City must contain 2-80 characters."),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("password").notEmpty().withMessage("Password is required."),
];

router.post(
  "/register",
  authLimiter,
  registerValidation,
  validateRequest,
  register,
);
router.post("/login", authLimiter, loginValidation, validateRequest, login);
router.get("/me", requireAuth, getCurrentUser);

module.exports = { authRouter: router };

