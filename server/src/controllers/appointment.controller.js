const { Appointment } = require("../models/Appointment");
const { User } = require("../models/User");

const activeStatuses = ["pending", "confirmed"];
const customerSelection = "firstName lastName avatarUrl email city";
const businessSelection =
  "firstName lastName avatarUrl city businessProfile.name businessProfile.address businessProfile.phone";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function personSummary(user, includeBusiness = false) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    city: user.city,
    email: user.email,
    businessName: includeBusiness ? user.businessProfile?.name || "" : undefined,
    businessAddress: includeBusiness
      ? user.businessProfile?.address || ""
      : undefined,
    businessPhone: includeBusiness
      ? user.businessProfile?.phone || ""
      : undefined,
  };
}

function presentAppointment(appointment) {
  return {
    id: appointment._id.toString(),
    customer: personSummary(appointment.customer),
    business: personSummary(appointment.business, true),
    service: {
      serviceId: appointment.service.serviceId.toString(),
      name: appointment.service.name,
      durationMinutes: appointment.service.durationMinutes,
      price: appointment.service.price,
    },
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    note: appointment.note,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

function populateParticipants(appointmentOrQuery) {
  return appointmentOrQuery.populate([
    { path: "customer", select: customerSelection },
    { path: "business", select: businessSelection },
  ]);
}

function calculateEndAt(startAt, durationMinutes) {
  return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
}

async function findConflict({ businessId, customerId, startAt, endAt, excludeId }) {
  const sharedWindow = {
    status: { $in: activeStatuses },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (excludeId) {
    sharedWindow._id = { $ne: excludeId };
  }

  const [businessConflict, customerConflict] = await Promise.all([
    Appointment.findOne({ ...sharedWindow, business: businessId }),
    Appointment.findOne({ ...sharedWindow, customer: customerId }),
  ]);

  return { businessConflict, customerConflict };
}

async function createAppointment(req, res, next) {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customer accounts can book appointments.",
      });
    }

    const business = await User.findOne({
      _id: req.body.businessId,
      role: "business_owner",
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "The selected business was not found.",
      });
    }

    const service = business.businessProfile?.services?.id(req.body.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "The selected service is no longer available.",
      });
    }

    const startAt = new Date(req.body.startAt);
    if (startAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Choose an appointment time in the future.",
      });
    }

    const endAt = calculateEndAt(startAt, service.durationMinutes);
    const conflict = await findConflict({
      businessId: business.id,
      customerId: req.user.id,
      startAt,
      endAt,
    });

    if (conflict.businessConflict) {
      return res.status(409).json({
        success: false,
        message: "This time overlaps another appointment at the business.",
      });
    }

    if (conflict.customerConflict) {
      return res.status(409).json({
        success: false,
        message: "You already have another appointment at this time.",
      });
    }

    const appointment = await Appointment.create({
      customer: req.user.id,
      business: business.id,
      service: {
        serviceId: service._id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
      },
      startAt,
      endAt,
      note: req.body.note || "",
    });

    await populateParticipants(appointment);

    return res.status(201).json({
      success: true,
      message: "Appointment request sent successfully.",
      appointment: presentAppointment(appointment),
    });
  } catch (error) {
    return next(error);
  }
}

async function listAppointments(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const filter =
      req.user.role === "business_owner"
        ? { business: req.user.id }
        : { customer: req.user.id };

    if (req.query.q) {
      filter["service.name"] = new RegExp(escapeRegex(req.query.q.trim()), "i");
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.businessId && req.user.role === "customer") {
      filter.business = req.query.businessId;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filter.startAt = {};
      if (req.query.dateFrom) {
        filter.startAt.$gte = new Date(`${req.query.dateFrom}T00:00:00.000Z`);
      }
      if (req.query.dateTo) {
        filter.startAt.$lte = new Date(`${req.query.dateTo}T23:59:59.999Z`);
      }
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("customer", customerSelection)
        .populate("business", businessSelection)
        .sort({ startAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      appointments: appointments.map(presentAppointment),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getAppointmentById(req, res, next) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      $or: [{ customer: req.user.id }, { business: req.user.id }],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    await populateParticipants(appointment);
    return res.json({
      success: true,
      appointment: presentAppointment(appointment),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    const isCustomer = appointment.customer.toString() === req.user.id;
    const isBusiness = appointment.business.toString() === req.user.id;

    if (!isCustomer && !isBusiness) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this appointment.",
      });
    }

    const hasSupportedChange = ["startAt", "note", "status"].some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );
    if (!hasSupportedChange) {
      return res.status(400).json({
        success: false,
        message: "Provide an appointment field to update.",
      });
    }

    if (isCustomer) {
      if (req.body.status === "cancelled") {
        if (!activeStatuses.includes(appointment.status)) {
          return res.status(409).json({
            success: false,
            message: "Only pending or confirmed appointments can be cancelled.",
          });
        }
        appointment.status = "cancelled";
      } else {
        if (req.body.status) {
          return res.status(403).json({
            success: false,
            message: "Customers can only cancel an appointment status.",
          });
        }

        if (appointment.status !== "pending") {
          return res.status(409).json({
            success: false,
            message: "Only pending appointments can be rescheduled or edited.",
          });
        }

        if (req.body.startAt) {
          const startAt = new Date(req.body.startAt);
          if (startAt.getTime() <= Date.now()) {
            return res.status(400).json({
              success: false,
              message: "Choose an appointment time in the future.",
            });
          }

          const endAt = calculateEndAt(
            startAt,
            appointment.service.durationMinutes,
          );
          const conflict = await findConflict({
            businessId: appointment.business,
            customerId: appointment.customer,
            startAt,
            endAt,
            excludeId: appointment.id,
          });

          if (conflict.businessConflict || conflict.customerConflict) {
            return res.status(409).json({
              success: false,
              message: "The new time overlaps another appointment.",
            });
          }

          appointment.startAt = startAt;
          appointment.endAt = endAt;
        }

        if (req.body.note !== undefined) {
          appointment.note = req.body.note;
        }
      }
    } else {
      if (req.body.startAt !== undefined || req.body.note !== undefined) {
        return res.status(403).json({
          success: false,
          message: "The business can update only the appointment status.",
        });
      }

      const allowedTransitions = {
        pending: ["confirmed", "declined"],
        confirmed: ["completed", "cancelled"],
      };
      const nextStatuses = allowedTransitions[appointment.status] || [];

      if (!req.body.status || !nextStatuses.includes(req.body.status)) {
        return res.status(409).json({
          success: false,
          message: "This status change is not allowed.",
        });
      }

      appointment.status = req.body.status;
    }

    await appointment.save();
    await populateParticipants(appointment);

    return res.json({
      success: true,
      message: "Appointment updated successfully.",
      appointment: presentAppointment(appointment),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment was not found.",
      });
    }

    const isCustomer = appointment.customer.toString() === req.user.id;
    const isBusiness = appointment.business.toString() === req.user.id;

    if (!isCustomer && !isBusiness) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this appointment.",
      });
    }

    const deletableStatuses = ["cancelled", "declined", "completed"];
    if (!deletableStatuses.includes(appointment.status)) {
      return res.status(409).json({
        success: false,
        message: "Cancel or complete the appointment before deleting it.",
      });
    }

    await appointment.deleteOne();

    return res.json({
      success: true,
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment,
};
