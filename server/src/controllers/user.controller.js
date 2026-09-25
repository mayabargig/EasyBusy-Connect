const { User } = require("../models/User");
const { Appointment } = require("../models/Appointment");
const { Message } = require("../models/Message");
const { Post } = require("../models/Post");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeServices(services = []) {
  return services.map((service) => ({
    name: normalizedText(service.name),
    description: normalizedText(service.description),
    durationMinutes: Number(service.durationMinutes),
    price: Number(service.price),
  }));
}

async function listUsers(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.city) {
      filter.city = {
        $regex: `^${escapeRegex(req.query.city.trim())}$`,
        $options: "i",
      };
    }

    if (req.query.category) {
      filter["businessProfile.category"] = req.query.category;
    }

    if (req.query.q) {
      const searchPattern = new RegExp(escapeRegex(req.query.q.trim()), "i");
      filter.$or = [
        { firstName: searchPattern },
        { lastName: searchPattern },
        { city: searchPattern },
        { "businessProfile.name": searchPattern },
        { "businessProfile.description": searchPattern },
        { "businessProfile.services.name": searchPattern },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users: users.map((user) => user.toDirectoryJSON()),
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

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile was not found.",
      });
    }

    return res.json({ success: true, user: user.toDirectoryJSON() });
  } catch (error) {
    return next(error);
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    const {
      avatarUrl,
      bio,
      businessProfile,
      city,
      email,
      firstName,
      lastName,
    } = req.body;

    if (email && email.toLowerCase().trim() !== req.user.email) {
      const emailOwner = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.user.id },
      });

      if (emailOwner) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }
    }

    if (businessProfile !== undefined && req.user.role !== "business_owner") {
      return res.status(403).json({
        success: false,
        message: "Only business owners can publish a business profile.",
      });
    }

    req.user.firstName = normalizedText(firstName);
    req.user.lastName = normalizedText(lastName);
    req.user.email = email.toLowerCase().trim();
    req.user.city = normalizedText(city);
    req.user.avatarUrl = normalizedText(avatarUrl);
    req.user.bio = normalizedText(bio);

    if (req.user.role === "business_owner") {
      req.user.businessProfile = {
        name: normalizedText(businessProfile?.name),
        category: normalizedText(businessProfile?.category),
        description: normalizedText(businessProfile?.description),
        phone: normalizedText(businessProfile?.phone),
        website: normalizedText(businessProfile?.website),
        address: normalizedText(businessProfile?.address),
        services: normalizeServices(businessProfile?.services),
      };
    }

    await req.user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("+password");

    if (!user || !(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "The current password is incorrect.",
      });
    }

    await Promise.all([
      Appointment.deleteMany({
        $or: [{ customer: user.id }, { business: user.id }],
      }),
      Message.deleteMany({
        $or: [{ sender: user.id }, { recipient: user.id }],
      }),
      Post.deleteMany({ author: user.id }),
      user.deleteOne(),
    ]);

    return res.json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  deleteCurrentUser,
  getUserById,
  listUsers,
  updateCurrentUser,
};
