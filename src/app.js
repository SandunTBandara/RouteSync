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
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const locationRoutes = require("./routes/locationRoutesFinal");

const app = express();

// Connect to database
connectDatabase();

// Security middleware - configured for HTTP servers and Swagger UI
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow Swagger UI to load
  crossOriginOpenerPolicy: false, // Disable COOP for HTTP compatibility
  crossOriginEmbedderPolicy: false, // Disable COEP for HTTP compatibility
}));

// CORS configuration - Allow all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: "*",
    credentials: false,
  })
);

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

// Favicon endpoint
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "NTC Bus Tracking API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health"
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/buses", busRoutes);
app.use("/api/v1/routes", routeRoutes);
app.use("/api/v1/locations", locationRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;

