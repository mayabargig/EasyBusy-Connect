const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1200,
    },
    category: {
      type: String,
      enum: ["event", "general", "promotion", "question", "recommendation"],
      default: "general",
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["none", "image", "video"],
      default: "none",
    },
    mediaUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

postSchema.index({ createdAt: -1, category: 1 });
postSchema.index({ content: "text" });

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
