const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  console.error(`\n[${timestamp}] ERROR AT: ${method} ${url}`);
  console.error(`MESSAGE: ${err.message}`);

  if (err.stack) {
    const stackLines = err.stack.split("\n").slice(0, 4).join("\n");
    console.error(`TRACES AT THE STREAM:\n${stackLines}`);
  }

  let statusCode = 500;
  let message = "Internal Server Error";

  // AppError (Lỗi do mình chủ động throw)
  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Lỗi Validation của Database (VD: Kiểu dữ liệu không hợp lệ)
  else if (err.name === "SequelizeValidationError") {
    statusCode = 400; // Bad Request
    message = err.errors[0]?.message || "Invalid input data";
  }
  // Lỗi trùng lặp dữ liệu (VD: Thêm 2 thiết bị trùng ID hoặc trùng khóa Unique)
  else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409; // Conflict
    message =
      err.errors[0]?.message ||
      "Data already exists (Unique constraint violation)";
  }
  // Lỗi kết nối hoặc truy vấn DB
  else if (
    [
      "SequelizeConnectionError",
      "SequelizeConnectionRefusedError",
      "SequelizeHostNotFoundError",
      "SequelizeHostNotReachableError",
      "SequelizeAccessDeniedError",
      "SequelizeDatabaseError",
    ].includes(err.name)
  ) {
    statusCode = 500;
    message = "Database error. Please check database connection and schema.";
  }

  // Trả về JSON cho Frontend
  res.status(statusCode).json({
    success: false,
    data: null,
    status: `${statusCode}`.startsWith("4") ? "fail" : "error",
    message: message,
  });
};

module.exports = errorHandler;
