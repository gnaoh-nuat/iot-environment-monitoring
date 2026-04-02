/**
 * Format date và time
 */
export const formatDate = (date, format = "DD/MM/YYYY") => {
  if (!date) return "";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  const formats = {
    "DD/MM/YYYY": `${day}/${month}/${year}`,
    "YYYY-MM-DD": `${year}-${month}-${day}`,
    "DD/MM/YYYY HH:mm": `${day}/${month}/${year} ${hours}:${minutes}`,
    "DD/MM/YYYY HH:mm:ss": `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    "HH:mm": `${hours}:${minutes}`,
    "HH:mm:ss": `${hours}:${minutes}:${seconds}`,
  };

  return formats[format] || formats["DD/MM/YYYY"];
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatTimeAgo = (date) => {
  if (!date) return "";

  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return "vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

  return formatDate(date);
};

/**
 * Format number - thêm dấu phân cách hàng nghìn
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return "";

  return Number(num).toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "";

  return Number(amount).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return "";

  return `${Number(value).toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

/**
 * Format file size (bytes)
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50, suffix = "...") => {
  if (!text || text.length <= maxLength) return text;

  return text.substring(0, maxLength) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert sensor type to display name
 */
export const formatSensorType = (type) => {
  const typeNames = {
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    light: "Ánh sáng",
    pressure: "Áp suất",
    motion: "Chuyển động",
    co2: "CO2",
  };

  return typeNames[type] || capitalize(type);
};
