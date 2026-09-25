const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { Message } = require("../models/Message");
const { User } = require("../models/User");
const {
  populateMessage,
  presentMessage,
  rolesCanChat,
} = require("../utils/message.utils");

function respond(callback, payload) {
  if (typeof callback === "function") callback(payload);
}

function initializeChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication is required."));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("The connected user no longer exists."));

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Your chat session is invalid or has expired."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("chat:send", async (payload = {}, callback) => {
      try {
        const recipientId = String(payload.recipientId || "");
        const content = typeof payload.content === "string" ? payload.content.trim() : "";

        if (!recipientId.match(/^[a-f\d]{24}$/i)) {
          return respond(callback, { success: false, message: "Recipient is invalid." });
        }

        if (!content || content.length > 1000) {
          return respond(callback, {
            success: false,
            message: "Message content must contain 1-1,000 characters.",
          });
        }

        const recipient = await User.findById(recipientId);
        if (!rolesCanChat(socket.user, recipient)) {
          return respond(callback, {
            success: false,
            message: "Chats are available between customers and business owners.",
          });
        }

        const message = await Message.create({
          sender: socket.user.id,
          recipient: recipient.id,
          content,
        });
        await populateMessage(message);

        const presentedMessage = presentMessage(message);
        io.to(`user:${socket.user.id}`).emit("chat:message", presentedMessage);
        io.to(`user:${recipient.id}`).emit("chat:message", presentedMessage);
        return respond(callback, { success: true, message: presentedMessage });
      } catch {
        return respond(callback, {
          success: false,
          message: "The message could not be sent. Please try again.",
        });
      }
    });
  });

  return io;
}

module.exports = { initializeChatSocket };
