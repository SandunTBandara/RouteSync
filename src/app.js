const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const connectDatabase = require("./config/database");
const swaggerOptions = require("./config/swagger");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

// Route imports
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Swagger documentation setup
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/v1/buses", busRoutes);
app.use("/api/v1/routes", routeRoutes);
app.use("/api/v1/locations", locationRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
