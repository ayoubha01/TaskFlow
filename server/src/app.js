import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Log every request — helpful while debugging; safe to keep in dev.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode}`, {
        ms: Date.now() - start,
      });
    });
    next();
  });

  // Serve local file uploads directly when not using S3 (dev convenience)
  if (!env.uploadsBucket) {
    app.use("/uploads", express.static(path.resolve("uploads")));
  }

  // Health check — used by ALB target group and Docker HEALTHCHECK
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/uploads", uploadsRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}