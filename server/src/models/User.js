const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240,
    },
    durationMinutes: {
      type: Number,
      min: 10,
      max: 480,
      default: 30,
    },
    price: {
      type: Number,
      min: 0,
      max: 100000,
      default: 0,
    },
  },
  { _id: true, versionKey: false },
);

const businessProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: [
        "",
        "beauty",
        "education",
        "events",
        "fitness",
        "food",
        "health",
        "home_services",
        "other",
      ],
      default: "",
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 800,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 25,
    },
    website: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    services: {
      type: [serviceSchema],
      default: [],
      validate: {
        validator(services) {
          return services.length <= 12;
        },
        message: "A business can publish up to 12 services.",
      },
    },
  },
  { _id: false, versionKey: false },
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "business_owner"],
      default: "customer",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 400,
    },
    businessProfile: {
      type: businessProfileSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    city: this.city,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    businessProfile: this.businessProfile,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.methods.toDirectoryJSON = function toDirectoryJSON() {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    city: this.city,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    businessProfile: this.businessProfile,
    createdAt: this.createdAt,
  };
};

userSchema.index({
  role: 1,
  city: 1,
  "businessProfile.category": 1,
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
