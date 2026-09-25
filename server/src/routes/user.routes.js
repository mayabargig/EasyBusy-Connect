const express = require("express");
const { body, param, query } = require("express-validator");
const {
  deleteCurrentUser,
  getUserById,
  listUsers,
  updateCurrentUser,
} = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();

const categories = [
  "beauty",
  "education",
  "events",
  "fitness",
  "food",
  "health",
  "home_services",
  "other",
];

const listValidation = [
  query("q")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search text can contain up to 100 characters."),
  query("city")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("City can contain up to 80 characters."),
  query("category")
    .optional({ checkFalsy: true })
    .isIn(categories)
    .withMessage("Select a valid business category."),
  query("role")
    .optional({ checkFalsy: true })
    .isIn(["customer", "business_owner"])
    .withMessage("Select a valid account type."),
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page must be a positive number."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50."),
];

const profileValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("First name must contain 2-40 characters."),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("Last name must contain 2-40 characters."),
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("city")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("City must contain 2-80 characters."),
  body("avatarUrl")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Avatar must be a complete HTTP or HTTPS URL."),
  body("bio")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 400 })
    .withMessage("Bio can contain up to 400 characters."),
  body("businessProfile.name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business name can contain up to 100 characters."),
  body("businessProfile.category")
    .optional({ checkFalsy: true })
    .isIn(categories)
    .withMessage("Select a valid business category."),
  body("businessProfile.description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 800 })
    .withMessage("Business description can contain up to 800 characters."),
  body("businessProfile.phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 25 })
    .withMessage("Phone can contain up to 25 characters."),
  body("businessProfile.website")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Website must be a complete HTTP or HTTPS URL."),
  body("businessProfile.address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 160 })
    .withMessage("Address can contain up to 160 characters."),
  body("businessProfile.services")
    .optional()
    .isArray({ max: 12 })
    .withMessage("A business can publish up to 12 services."),
  body("businessProfile.services.*.name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Each service name must contain 2-80 characters."),
  body("businessProfile.services.*.description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 240 })
    .withMessage("Service description can contain up to 240 characters."),
  body("businessProfile.services.*.durationMinutes")
    .isInt({ min: 10, max: 480 })
    .withMessage("Service duration must be between 10 and 480 minutes."),
  body("businessProfile.services.*.price")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Service price must be between 0 and 100,000."),
];

router.use(requireAuth);

router.get("/", listValidation, validateRequest, listUsers);
router.patch("/me", profileValidation, validateRequest, updateCurrentUser);
router.delete(
  "/me",
  body("currentPassword")
    .notEmpty()
    .withMessage("Enter your current password to delete the account."),
  validateRequest,
  deleteCurrentUser,
);
router.get(
  "/:userId",
  param("userId").isMongoId().withMessage("User identifier is invalid."),
  validateRequest,
  getUserById,
);

module.exports = { userRouter: router };
