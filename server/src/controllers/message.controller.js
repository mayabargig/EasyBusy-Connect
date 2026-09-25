const { Message } = require("../models/Message");
const { User } = require("../models/User");
const {
  populateMessage,
  presentMessage,
  presentUser,
  rolesCanChat,
  userSelection,
} = require("../utils/message.utils");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function conversationFilter(firstUserId, secondUserId) {
  return {
    $or: [
      { sender: firstUserId, recipient: secondUserId },
      { sender: secondUserId, recipient: firstUserId },
    ],
  };
}

async function listConversations(req, res, next) {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    })
      .populate("sender", userSelection)
      .populate("recipient", userSelection)
      .sort({ createdAt: -1 })
      .limit(1000);

    const conversationMap = new Map();

    for (const message of messages) {
      const senderId = message.sender?._id.toString();
      const otherUser = senderId === req.user.id ? message.recipient : message.sender;
      if (!otherUser) continue;

      const otherId = otherUser._id.toString();
      const existing = conversationMap.get(otherId);

      if (!existing) {
        conversationMap.set(otherId, {
          user: presentUser(otherUser),
          lastMessage: presentMessage(message),
          unreadCount: 0,
        });
      }

      if (
        message.recipient?._id.toString() === req.user.id
        && !message.readAt
      ) {
        conversationMap.get(otherId).unreadCount += 1;
      }
    }

    return res.json({
      success: true,
      conversations: Array.from(conversationMap.values()),
    });
  } catch (error) {
    return next(error);
  }
}

async function getConversation(req, res, next) {
  try {
    const otherUser = await User.findById(req.params.userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "The selected chat user was not found.",
      });
    }

    if (!rolesCanChat(req.user, otherUser)) {
      return res.status(403).json({
        success: false,
        message: "Chats are available between customers and business owners.",
      });
    }

    await Message.updateMany(
      { sender: otherUser.id, recipient: req.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );

    const filter = conversationFilter(req.user.id, otherUser.id);
    if (req.query.q) {
      filter.content = new RegExp(escapeRegex(req.query.q.trim()), "i");
    }

    const messages = await Message.find(filter)
      .populate("sender", userSelection)
      .populate("recipient", userSelection)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      user: presentUser(otherUser),
      messages: messages.reverse().map(presentMessage),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message was not found." });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can edit only messages you sent.",
      });
    }

    message.content = req.body.content;
    await message.save();
    await populateMessage(message);

    const presentedMessage = presentMessage(message);
    const io = req.app.get("io");
    io?.to(`user:${message.sender.id}`).emit("chat:message-updated", presentedMessage);
    io?.to(`user:${message.recipient.id}`).emit("chat:message-updated", presentedMessage);

    return res.json({
      success: true,
      message: "Message updated successfully.",
      chatMessage: presentedMessage,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message was not found." });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can delete only messages you sent.",
      });
    }

    const senderId = message.sender.toString();
    const recipientId = message.recipient.toString();
    const messageId = message.id;
    await message.deleteOne();

    const io = req.app.get("io");
    const payload = { messageId, senderId, recipientId };
    io?.to(`user:${senderId}`).emit("chat:message-deleted", payload);
    io?.to(`user:${recipientId}`).emit("chat:message-deleted", payload);

    return res.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  deleteMessage,
  getConversation,
  listConversations,
  updateMessage,
};
