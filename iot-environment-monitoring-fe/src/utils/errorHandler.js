import { ERROR_MESSAGES } from "../constants/api";

/**
 * Parse API error - extract message từ error object
 */
export const parseApiError = (error) => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Handle API error - log + return user-friendly message
 */
export const handleApiError = (error, context = "") => {
  const message = parseApiError(error);

  console.error(`[${context}] API Error:`, {
    error,
    message,
    timestamp: new Date().toISOString(),
  });

  return message;
};

/**
 * Handle validation error
 */
export const handleValidationError = (errors) => {
  if (Array.isArray(errors)) {
    return errors[0];
  }

  if (typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    return errors[firstKey];
  }

  return ERROR_MESSAGES.VALIDATION_ERROR;
};

/**
 * Log error to service/analytics (placeholder)
 */
export const logErrorToService = async (error, context = "") => {
  try {
    // TODO: Send to error tracking service (Sentry, DataDog, etc)
    console.log("Logging error to service:", { error, context });
  } catch (err) {
    console.error("Failed to log error:", err);
  }
};
