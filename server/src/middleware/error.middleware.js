import { logger } from "../utils/logger.js";

export function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
  }

  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
  });
}

export function notFoundMiddleware(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}