export const HTTP_MESSAGE = {
  SUCCESS: {
    OK: 'Request successful.',
    CREATED: 'Resource created successfully.',
    UPDATED: 'Resource updated successfully.',
    DELETED: 'Resource deleted successfully.',
    GENERATED: 'Resource generated successfully.',
    FETCHED: 'Data fetched successfully.',
  },

  AUTH: {
    LOGIN_SUCCESS: 'Logged in successfully.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    UNAUTHORIZED: 'Unauthorized access.',
    TOKEN_EXPIRED: 'Token has expired.',
    TOKEN_INVALID: 'Token is invalid or malformed.',
    TOKEN_MISSING: 'Token is missing.',
    INVALID_ACCESS_TOKEN: 'Invalid access token.',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token.',
    SESSION_EXPIRED: 'Session expired. Please login again.',
    SESSION_INVALID: 'Session is invalid or expired.',
    AUTHENTICATION_REQUIRED: 'Authentication is required for this action.',
    PERMISSION_DENIED: 'Permission denied.',
    ACCESS_DENIED: 'You do not have permission.',
  },

  USER: {
    NOT_FOUND: 'User not found.',
    BLOCKED: 'User is blocked.',
    INACTIVE: 'Account is inactive.',
    LOCKED: 'Account locked due to too many failed login attempts.',
    EMAIL_NOT_VERIFIED: 'Email address is not verified.',
    EMAIL_ALREADY_EXISTS: 'Email already in use.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    PASSWORD_WEAK: 'Password does not meet complexity requirements.',
    PASSWORD_RESET_LINK_SENT: 'Password reset link sent.',
    PASSWORD_RESET_SUCCESS: 'Password reset successful.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    ACCOUNT_ACTIVATED: 'Account activated successfully.',
  },

  VALIDATION: {
    FAILED: 'Validation failed.',
    BAD_REQUEST: 'Bad request.',
    INVALID_INPUT: 'Invalid input provided.',
    MISSING_FIELDS: 'Required fields are missing.',
    INVALID_OPERATION: 'Invalid operation requested.',
    INVALID_STATE: 'Invalid state for this operation.',
  },

  OTP: {
    EXPIRED: 'OTP has expired.',
    INVALID: 'OTP is invalid.',
    SENT: 'OTP has been sent.',
  },

  TOKEN: {
    VERIFICATION_REQUIRED: 'Verification token is required.',
    VERIFICATION_EXPIRED: 'Verification link is expired.',
  },

  FILE: {
    TOO_LARGE: 'Uploaded file is too large.',
    INVALID_TYPE: 'Invalid file type.',
    UPLOAD_FAILED: 'File upload failed.',
    NOT_FOUND: 'File not found.',
  },

  DATABASE: {
    ERROR: 'Database error occurred.',
    CONFLICT: 'Data conflict detected.',
    INTEGRITY_ERROR: 'Data integrity violation detected.',
  },

  SYSTEM: {
    INTERNAL_ERROR: 'Something went wrong on our end.',
    UNKNOWN_ERROR: 'An unknown error occurred.',
    UNEXPECTED_ERROR: 'An unexpected error occurred.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
    TIMEOUT: 'Request timed out. Try again.',
    MAINTENANCE: 'Service is under maintenance. Please try later.',
    CONFIG_ERROR: 'Configuration error encountered.',
    DEPENDENCY_FAILURE: 'A dependency failed. Please try again.',
    NETWORK_ERROR: 'Network error occurred. Check your connection.',
  },

  RESOURCE: {
    NOT_FOUND: 'Resource not found.',
    EXISTS: 'Resource already exists.',
    DUPLICATE: 'Duplicate entry found.',
    CONFLICT: 'Conflict occurred while processing request.',
    LOCKED: 'Resource is locked and cannot be modified.',
  },

  RATE_LIMIT: {
    EXCEEDED: 'Rate limit exceeded. Please try again later.',
  },

  FEATURE: {
    NOT_IMPLEMENTED: 'This feature is not implemented yet.',
    DEPRECATED: 'This service or API is deprecated.',
  },
} as const;
