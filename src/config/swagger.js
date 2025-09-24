const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NTC Bus Tracking API",
      version: "1.0.0",
      description:
        "Real-time GPS tracking system for NTC Sri Lanka inter-provincial buses",
      contact: {
        name: "NTC Sri Lanka",
        url: "https://www.ntc.gov.lk",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Bus: {
          type: "object",
          properties: {
            _id: { type: "string" },
            busNumber: { type: "string" },
            operatorId: { type: "string" },
            routeId: { type: "string" },
            capacity: { type: "number" },
            busType: {
              type: "string",
              enum: ["Normal", "Semi Luxury", "Luxury", "Super Luxury"],
            },
            currentLocation: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["Point"] },
                coordinates: { type: "array", items: { type: "number" } },
              },
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "maintenance"],
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerOptions;
