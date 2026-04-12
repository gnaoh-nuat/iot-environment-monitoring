require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");

const errorHandler = require("./middlewares/errorHandler");
const rootRouter = require("./routes");
const sequelize = require("./config/database");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const initializeAssociations = require("./models/associations");

const { initSocket } = require("./socket/socketHandler");
const { setSocket } = require("./mqtt/mqttClient");

// ===== INIT APP =====
const app = express();
const PORT = process.env.PORT || 8080;

// 🔥 TẠO HTTP SERVER (QUAN TRỌNG)
const server = http.createServer(app);

// ===== MIDDLEWARE =====
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ===== SOCKET.IO =====
const io = initSocket(server);
setSocket(io);

// ===== MQTT (QUAN TRỌNG) =====
require("./mqtt/mqttClient");

// ===== SWAGGER =====
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Redirect root URL to Swagger for quick API testing.
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

const startServer = async () => {
  try {
    // Ensure associations are initialized before any query runs.
    initializeAssociations();

    await sequelize.authenticate();
    console.log("Database connected successfully.");

    await sequelize.sync({ alter: true });
    console.log("Database schema synchronized successfully.");

    // Register business routes only after DB is ready.
    app.use(rootRouter);

    // ===== ERROR HANDLER =====
    app.use(errorHandler);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log("SERVER IS READY TO HANDLE REQUESTS !");
    });
  } catch (error) {
    console.error("Unable to start server due to database error:", error);
    process.exit(1);
  }
};

startServer();
