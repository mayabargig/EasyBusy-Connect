const mongoose = require("mongoose");

const serviceSnapshotSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 10,
      max: 480,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
  },
  { _id: false, versionKey: false },
);

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    service: {
      type: serviceSnapshotSchema,
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

appointmentSchema.index({ business: 1, startAt: 1, status: 1 });
appointmentSchema.index({ customer: 1, startAt: 1, status: 1 });
appointmentSchema.index({ "service.name": "text" });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = { Appointment };
