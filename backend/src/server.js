import express from "express";
import http from "http";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { ensureMessagesTable } from "./lib/dynamo.js";
import authRoutes from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
import messagesRoutes from "./routes/messages.route.js";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { User } from "./models/index.js";
import { docClient, messagesTableName } from "./lib/dynamo.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();
app.use(express.json());
app.use(cookieParser());
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: clientUrl,
    credentials: true, // Allow cookies to be sent
  })
);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messagesRoutes);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie || "";
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.jwt;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findByPk(decoded.userId);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.user = user;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.user._id.toString();
  socket.join(`user:${userId}`);

  socket.on("typing:start", (payload) => {
    const toUserId = payload?.toUserId;
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit("typing:start", { fromUserId: userId });
  });

  socket.on("typing:stop", (payload) => {
    const toUserId = payload?.toUserId;
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit("typing:stop", { fromUserId: userId });
  });

  socket.on("message:send", async (payload, ack) => {
    try {
      const toUserId = payload?.toUserId;
      const text = payload?.text?.trim();
      const clientId = payload?.clientId || null;
      if (!toUserId || !text) return;

      const createdAt = Date.now();
      const conversationId = [userId, toUserId].sort().join("-");
      const message = {
        conversationId,
        createdAt,
        messageId: crypto.randomUUID(),
        senderId: userId,
        receiverId: toUserId,
        text,
      };

      await docClient.send(
        new PutCommand({
          TableName: messagesTableName,
          Item: message,
        })
      );

      io.to(`user:${toUserId}`).emit("message:new", message);
      if (typeof ack === "function") {
        ack({ ok: true, message, clientId });
      }
    } catch (error) {
      console.error("Error sending message:", error.message);
      if (typeof ack === "function") {
        ack({ ok: false, error: "Failed to send message" });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
  connectDB();
  ensureMessagesTable().catch((error) => {
    console.error("Error ensuring DynamoDB table:", error.message);
  });
});
