const errorHandler = (err, req, res, next) => {
  console.error(
    `\n[${new Date().toISOString()}] ERROR AT: ${req.method} ${req.originalUrl}`,
  );
  console.error(err.stack?.split("\n").slice(0, 5).join("\n") || err.message);

  let statusCode = 500;
  let message = "Internal Server Error";

  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    message = err.errors?.[0]?.message || "Invalid input data";
  } else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = err.errors?.[0]?.message || "Data already exists";
  } else if (String(err.name).startsWith("Sequelize")) {
    // Tối ưu: Bắt toàn bộ lỗi DB bằng chuỗi bắt đầu thay vì dùng mảng dài
    statusCode = 500;
    message = "Database connection or syntax error.";
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    status: String(statusCode).startsWith("4") ? "fail" : "error",
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
