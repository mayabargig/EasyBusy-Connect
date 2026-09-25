const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  updatePost,
} = require("../controllers/post.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();
const categories = ["event", "general", "promotion", "question", "recommendation"];

const postValidation = [
  body("content")
    .trim()
    .isLength({ min: 2, max: 1200 })
    .withMessage("Post content must contain 2-1,200 characters."),
  body("category")
    .isIn(categories)
    .withMessage("Select a valid post category."),
  body("mediaType")
    .optional()
    .isIn(["none", "image", "video"])
    .withMessage("Select a valid media type."),
  body("mediaUrl").custom((value, { req }) => {
    if (!req.body.mediaType || req.body.mediaType === "none") {
      return true;
    }

    if (!value) {
      throw new Error("A media URL is required for image and video posts.");
    }

    try {
      const parsedUrl = new URL(value);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error();
      }
      return true;
    } catch {
      throw new Error("Media URL must be a complete HTTP or HTTPS URL.");
    }
  }),
];

const listValidation = [
  query("q")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Search text can contain up to 120 characters."),
  query("category")
    .optional({ checkFalsy: true })
    .isIn(categories)
    .withMessage("Select a valid post category."),
  query("dateFrom")
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage("Start date is invalid."),
  query("dateTo")
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage("End date is invalid."),
  query("authorId")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Author identifier is invalid."),
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page must be a positive number."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50."),
];

const idValidation = [
  param("postId").isMongoId().withMessage("Post identifier is invalid."),
];

router.use(requireAuth);

router.get("/", listValidation, validateRequest, listPosts);
router.post("/", postValidation, validateRequest, createPost);
router.get("/:postId", idValidation, validateRequest, getPostById);
router.patch(
  "/:postId",
  idValidation,
  postValidation,
  validateRequest,
  updatePost,
);
router.delete("/:postId", idValidation, validateRequest, deletePost);

module.exports = { postRouter: router };
