const express = require("express");
const { query } = require("express-validator");
const { getAppointmentStats } = require("../controllers/stats.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/appointments",
  query("months")
    .optional()
    .isInt({ min: 3, max: 12 })
    .withMessage("Chart range must contain 3-12 months."),
  validateRequest,
  getAppointmentStats,
);

module.exports = { statsRouter: router };
