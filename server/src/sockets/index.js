import { Server } from "socket.io";
import { verifyToken } from "../services/auth.service.js";
import { assertIsMember } from "../services/projects.service.js";
import { logger } from "../utils/logger.js";

let io;

export function initSockets(httpServer, clientOrigin) {
  io = new Server(httpServer, {
    cors: { origin: clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));
      const payload = verifyToken(token);
      socket.user = { id: payload.sub, email: payload.email };
      next();
    } catch (err) {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info("socket connected", { userId: socket.user.id });

    socket.on("project:join", async (projectId, ack) => {
      try {
        await assertIsMember(projectId, socket.user.id);
        socket.join(`project:${projectId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", () => {
      logger.info("socket disconnected", { userId: socket.user.id });
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized — call initSockets first");
  }
  return io;
}