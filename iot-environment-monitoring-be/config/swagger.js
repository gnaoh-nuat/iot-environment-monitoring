const swaggerJsdoc = require("swagger-jsdoc");

// Xuất trực tiếp kết quả, bỏ qua các biến trung gian options/specs
module.exports = swaggerJsdoc({
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
});
