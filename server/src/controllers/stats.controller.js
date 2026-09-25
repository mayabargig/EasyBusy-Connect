const { Appointment } = require("../models/Appointment");

const appointmentStatuses = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
];

function createMonthKeys(monthCount) {
  const now = new Date();
  const keys = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const month = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - offset,
      1,
    ));
    keys.push(`${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return keys;
}

async function getAppointmentStats(req, res, next) {
  try {
    const monthCount = Number(req.query.months || 6);
    const monthKeys = createMonthKeys(monthCount);
    const firstMonth = new Date(`${monthKeys[0]}-01T00:00:00.000Z`);
    const participantField = req.user.role === "business_owner" ? "business" : "customer";
    const participantMatch = { [participantField]: req.user._id };

    const [statusGroups, monthGroups] = await Promise.all([
      Appointment.aggregate([
        { $match: participantMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        {
          $match: {
            ...participantMatch,
            startAt: { $gte: firstMonth },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$startAt",
                timezone: "Asia/Jerusalem",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const statusCountMap = new Map(
      statusGroups.map((group) => [group._id, group.count]),
    );
    const monthCountMap = new Map(
      monthGroups.map((group) => [group._id, group.count]),
    );

    const byStatus = appointmentStatuses.map((status) => ({
      status,
      count: statusCountMap.get(status) || 0,
    }));
    const byMonth = monthKeys.map((month) => ({
      month,
      count: monthCountMap.get(month) || 0,
    }));

    return res.json({
      success: true,
      scope: req.user.role === "business_owner" ? "business" : "customer",
      totalAppointments: byStatus.reduce((sum, item) => sum + item.count, 0),
      byStatus,
      byMonth,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAppointmentStats };
