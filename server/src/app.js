const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { appointmentRouter } = require("./routes/appointment.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");
const { authRouter } = require("./routes/auth.routes");
const { messageRouter } = require("./routes/message.routes");
const { postRouter } = require("./routes/post.routes");
const { statsRouter } = require("./routes/stats.routes");
const { userRouter } = require("./routes/user.routes");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "EasyBusy Connect API is healthy." });
});

app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/messages", messageRouter);
app.use("/api/posts", postRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
