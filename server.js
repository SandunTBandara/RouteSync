require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, HOST, () => {
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  const host = HOST === '0.0.0.0' ? 'localhost' : HOST;

  logger.info(`🚀 NTC Bus Tracking API server running on ${protocol}://${host}:${PORT}`);
  logger.info(`📚 API Documentation available at ${protocol}://${host}:${PORT}/api-docs`);
  logger.info(`🏥 Health check available at ${protocol}://${host}:${PORT}/health`);

  if (NODE_ENV === 'production') {
    logger.info('🔒 Running in production mode with enhanced security');
  }
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
