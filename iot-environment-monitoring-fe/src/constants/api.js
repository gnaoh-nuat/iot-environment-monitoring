/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Sensors
  SENSORS: "/sensors",
  SENSOR_DETAIL: (id) => `/sensors/${id}`,
  SENSOR_DATA: (id) => `/sensors/${id}/data`,
  SENSOR_REAL_TIME: (id) => `/sensors/${id}/realtime`,

  // Readings/Data
  READINGS: "/readings",
  READINGS_BY_SENSOR: (sensorId) => `/readings?sensorId=${sensorId}`,
  READINGS_RANGE: (sensorId, startTime, endTime) =>
    `/readings?sensorId=${sensorId}&startTime=${startTime}&endTime=${endTime}`,

  // Actions/History
  ACTIONS: "/actions",
  ACTION_HISTORY: (filterType) => `/actions/history?type=${filterType}`,

  // User/Profile
  USER_PROFILE: "/user/profile",
  USER_UPDATE: "/user/profile",
  USER_SETTINGS: "/user/settings",

  // Auth (placeholder)
  AUTH_LOGIN: "/auth/login",
  AUTH_LOGOUT: "/auth/logout",
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra đường truyền.",
  TIMEOUT_ERROR: "Yêu cầu hết thời gian. Vui lòng thử lại.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  UNAUTHORIZED: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền truy cập tài nguyên này.",
  NOT_FOUND: "Tài nguyên không tìm thấy.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
  UNKNOWN_ERROR: "Có lỗi xảy ra. Vui lòng thử lại.",
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API Response Status
 */
export const API_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
