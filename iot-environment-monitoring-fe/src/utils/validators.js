/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate required field
 */
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== "";
};

/**
 * Validate min length
 */
export const validateMinLength = (value, min) => {
  return value && value.length >= min;
};

/**
 * Validate max length
 */
export const validateMaxLength = (value, max) => {
  return !value || value.length <= max;
};

/**
 * Validate number range
 */
export const validateRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate number
 */
export const validateNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Form validation helper
 */
export const validateForm = (formData, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];

    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  return errors;
};

/**
 * Validation rules factory
 */
export const rules = {
  required:
    (message = "Trường bắt buộc") =>
    (value) =>
      validateRequired(value) ? null : message,

  email:
    (message = "Email không hợp lệ") =>
    (value) =>
      !value || validateEmail(value) ? null : message,

  minLength:
    (min, message = `Tối thiểu ${min} ký tự`) =>
    (value) =>
      !value || validateMinLength(value, min) ? null : message,

  maxLength:
    (max, message = `Tối đa ${max} ký tự`) =>
    (value) =>
      validateMaxLength(value, max) ? null : message,

  range:
    (min, max, message = `Phải từ ${min} đến ${max}`) =>
    (value) =>
      !value || validateRange(value, min, max) ? null : message,

  number:
    (message = "Phải là số") =>
    (value) =>
      !value || validateNumber(value) ? null : message,

  positiveNumber:
    (message = "Phải là số dương") =>
    (value) =>
      !value || validatePositiveNumber(value) ? null : message,

  pattern:
    (pattern, message = "Định dạng không hợp lệ") =>
    (value) =>
      !value || pattern.test(value) ? null : message,
};

/**
 * Example usage:
 * const errors = validateForm(
 *   { email: 'test@example.com', password: 'pass123' },
 *   {
 *     email: [rules.required(), rules.email()],
 *     password: [rules.required(), rules.minLength(6)],
 *   }
 * );
 */
