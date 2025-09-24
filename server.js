require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 NTC Bus Tracking API server running on port ${PORT}`);
  logger.info(
    `📚 API Documentation available at http://localhost:${PORT}/api-docs`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated");
  });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
