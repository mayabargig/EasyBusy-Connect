const { Post } = require("../models/Post");

const authorSelection = "firstName lastName avatarUrl role businessProfile.name";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function presentPost(post) {
  const postObject = post.toObject();
  const author = post.author;

  return {
    id: postObject._id.toString(),
    content: postObject.content,
    category: postObject.category,
    mediaType: postObject.mediaType,
    mediaUrl: postObject.mediaUrl,
    createdAt: postObject.createdAt,
    updatedAt: postObject.updatedAt,
    author: author
      ? {
          id: author._id.toString(),
          firstName: author.firstName,
          lastName: author.lastName,
          avatarUrl: author.avatarUrl,
          role: author.role,
          businessName: author.businessProfile?.name || "",
        }
      : null,
  };
}

async function populateAuthor(postOrQuery) {
  return postOrQuery.populate("author", authorSelection);
}

async function createPost(req, res, next) {
  try {
    const mediaType = req.body.mediaType || "none";
    const post = await Post.create({
      author: req.user.id,
      content: req.body.content,
      category: req.body.category,
      mediaType,
      mediaUrl: mediaType === "none" ? "" : req.body.mediaUrl,
    });

    await populateAuthor(post);

    return res.status(201).json({
      success: true,
      message: "Post published successfully.",
      post: presentPost(post),
    });
  } catch (error) {
    return next(error);
  }
}

async function listPosts(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const filter = {};

    if (req.query.q) {
      filter.content = new RegExp(escapeRegex(req.query.q.trim()), "i");
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.authorId) {
      filter.author = req.query.authorId;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(`${req.query.dateFrom}T00:00:00.000Z`);
      }
      if (req.query.dateTo) {
        filter.createdAt.$lte = new Date(`${req.query.dateTo}T23:59:59.999Z`);
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", authorSelection)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      posts: posts.map(presentPost),
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

async function getPostById(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "author",
      authorSelection,
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post was not found.",
      });
    }

    return res.json({ success: true, post: presentPost(post) });
  } catch (error) {
    return next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post was not found.",
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can edit only posts you published.",
      });
    }

    post.content = req.body.content;
    post.category = req.body.category;
    post.mediaType = req.body.mediaType || "none";
    post.mediaUrl = post.mediaType === "none" ? "" : req.body.mediaUrl;
    await post.save();
    await populateAuthor(post);

    return res.json({
      success: true,
      message: "Post updated successfully.",
      post: presentPost(post),
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post was not found.",
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can delete only posts you published.",
      });
    }

    await post.deleteOne();

    return res.json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  updatePost,
};
