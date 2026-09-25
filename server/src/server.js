require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { app } = require("./app");
const { connectDatabase } = require("./config/database");
const { initializeChatSocket } = require("./socket/chat.socket");

const port = Number(process.env.PORT) || 5000;
let httpServer;
let chatIo;

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  await connectDatabase();

  httpServer = http.createServer(app);
  chatIo = initializeChatSocket(httpServer);
  app.set("io", chatIo);

  httpServer.listen(port, () => {
    console.log(`EasyBusy Connect API listening on http://localhost:${port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Closing the server safely.`);

  if (chatIo) {
    await new Promise((resolve) => chatIo.close(resolve));
  } else if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await mongoose.connection.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
