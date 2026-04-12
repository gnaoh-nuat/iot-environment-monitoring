const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IoT System API Documentation",
      version: "1.0.0",
      description:
        "API documentation for IoT device management, data monitoring and control system.",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:8080",
        description: "Development Server",
      },
    ],
  },

  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
