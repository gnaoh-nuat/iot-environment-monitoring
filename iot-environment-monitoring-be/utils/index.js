class AppError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const parsePagination = (reqQuery) => {
  const pageNo = Math.max(1, Number(reqQuery.pageNo) || 1);
  const pageSize = Math.max(1, Number(reqQuery.pageSize) || 10);

  return { pageNo, pageSize, offset: (pageNo - 1) * pageSize };
};

const parseSort = (reqQuery, allowedFields, aliases = {}) => {
  const sortBy = String(reqQuery.sortBy || "createdAt");
  const order = String(reqQuery.sortOrder || "desc").toUpperCase();

  if (!["ASC", "DESC"].includes(order)) {
    throw new AppError(400, "sortOrder không hợp lệ");
  }

  if (!allowedFields.includes(sortBy)) {
    throw new AppError(400, "sortBy không hợp lệ");
  }

  const alias = aliases[sortBy];
  if (!alias) {
    return [[sortBy, order]];
  }

  return alias.model
    ? [[alias.model, alias.field, order]]
    : [[alias.field, order]];
};

module.exports = {
  AppError,
  parsePagination,
  parseSort,
};
