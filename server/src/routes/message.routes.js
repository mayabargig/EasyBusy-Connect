const express = require("express");
const { body, param, query } = require("express-validator");
const {
  deleteMessage,
  getConversation,
  listConversations,
  updateMessage,
} = require("../controllers/message.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();

router.use(requireAuth);

router.get("/conversations", listConversations);
router.get(
  "/with/:userId",
  param("userId").isMongoId().withMessage("Chat user identifier is invalid."),
  query("q")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Message search can contain up to 100 characters."),
  validateRequest,
  getConversation,
);
router.patch(
  "/:messageId",
  param("messageId").isMongoId().withMessage("Message identifier is invalid."),
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message content must contain 1-1,000 characters."),
  validateRequest,
  updateMessage,
);
router.delete(
  "/:messageId",
  param("messageId").isMongoId().withMessage("Message identifier is invalid."),
  validateRequest,
  deleteMessage,
);

module.exports = { messageRouter: router };
