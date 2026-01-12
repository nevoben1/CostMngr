/**
 * Centralized error response utility
 * Ensures all error responses follow the standard format: { id, message }
 */

/**
 * Error ID constants
 */
const ErrorIds = {
  // Validation Errors (400)
  INVALID_MONTH: 'INVALID_MONTH',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  INVALID_DATE: 'INVALID_DATE',
  MISSING_USERID: 'MISSING_USERID',
  MISSING_FIELD: 'MISSING_FIELD',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Not Found Errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Server Errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Service Errors (503)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  USER_SERVICE_ERROR: 'USER_SERVICE_ERROR',
};

/**
 * Creates a standardized error response object
 * @param {string} id - Error identifier (use ErrorIds constants)
 * @param {string} message - Human-readable error message
 * @param {object} additionalFields - Optional additional fields to include
 * @returns {object} Standardized error response with id and message
 */
function createErrorResponse(id, message, additionalFields = {}) {
  return {
    id,
    message,
    ...additionalFields
  };
}

/**
 * Sends a standardized error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} id - Error identifier
 * @param {string} message - Human-readable error message
 * @param {object} additionalFields - Optional additional fields
 */
function sendErrorResponse(res, statusCode, id, message, additionalFields = {}) {
  res.status(statusCode).json(createErrorResponse(id, message, additionalFields));
}

module.exports = {
  ErrorIds,
  createErrorResponse,
  sendErrorResponse
};
