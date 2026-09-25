const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment,
} = require("../controllers/appointment.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = express.Router();
const statuses = ["pending", "confirmed", "declined", "cancelled", "completed"];

const idValidation = [
  param("appointmentId")
    .isMongoId()
    .withMessage("Appointment identifier is invalid."),
];

const listValidation = [
  query("q")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search text can contain up to 100 characters."),
  query("status")
    .optional({ checkFalsy: true })
    .isIn(statuses)
    .withMessage("Select a valid appointment status."),
  query("dateFrom")
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage("Start date is invalid."),
  query("dateTo")
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage("End date is invalid."),
  query("businessId")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Business identifier is invalid."),
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page must be a positive number."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50."),
];

const createValidation = [
  body("businessId")
    .isMongoId()
    .withMessage("Business identifier is invalid."),
  body("serviceId")
    .isMongoId()
    .withMessage("Service identifier is invalid."),
  body("startAt")
    .isISO8601()
    .withMessage("Choose a valid appointment date and time."),
  body("note")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Appointment note can contain up to 500 characters."),
];

const updateValidation = [
  body("startAt")
    .optional()
    .isISO8601()
    .withMessage("Choose a valid appointment date and time."),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Appointment note can contain up to 500 characters."),
  body("status")
    .optional()
    .isIn(statuses)
    .withMessage("Select a valid appointment status."),
];

router.use(requireAuth);

router.get("/", listValidation, validateRequest, listAppointments);
router.post("/", createValidation, validateRequest, createAppointment);
router.get(
  "/:appointmentId",
  idValidation,
  validateRequest,
  getAppointmentById,
);
router.patch(
  "/:appointmentId",
  idValidation,
  updateValidation,
  validateRequest,
  updateAppointment,
);
router.delete(
  "/:appointmentId",
  idValidation,
  validateRequest,
  deleteAppointment,
);

module.exports = { appointmentRouter: router };
