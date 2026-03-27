/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Error Handler Service
 * Provides consistent error handling across the Infinite Heroes Comic Creator app
 */

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

/**
 * Severity levels for errors
 * - info: Informational messages, not actual errors
 * - warning: Non-critical issues that don't block functionality
 * - error: Errors that affect functionality but allow recovery
 * - critical: Severe errors that may require user action or app restart
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Standardized error structure used throughout the application
 */
export interface AppError {
  /** Human-readable error message */
  message: string;
  /** Severity level of the error */
  severity: ErrorSeverity;
  /** Optional error code for programmatic handling */
  code?: string;
  /** Optional context describing where the error occurred */
  context?: string;
  /** Original error object for debugging */
  originalError?: unknown;
  /** Timestamp of when the error occurred */
  timestamp?: Date;
}

/**
 * Error codes for common error scenarios
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_UNKNOWN: 'NETWORK_UNKNOWN',

  // API errors
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_INVALID_KEY: 'API_INVALID_KEY',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  API_BAD_REQUEST: 'API_BAD_REQUEST',
  API_UNKNOWN: 'API_UNKNOWN',

  // AI-specific errors
  AI_CONTENT_BLOCKED: 'AI_CONTENT_BLOCKED',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',

  // Application errors
  APP_STATE_ERROR: 'APP_STATE_ERROR',
  APP_STORAGE_ERROR: 'APP_STORAGE_ERROR',
  APP_VALIDATION_ERROR: 'APP_VALIDATION_ERROR',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// ERROR DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects if an error is a network connectivity issue
 * Checks for common network error patterns from fetch, XMLHttpRequest, etc.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Check Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Common network error patterns
    const networkPatterns = [
      'network',
      'failed to fetch',
      'networkerror',
      'net::err_',
      'enotfound',
      'econnrefused',
      'econnreset',
      'etimedout',
      'unable to connect',
      'cors',
      'cross-origin',
      'offline',
      'internet',
      'dns',
    ];

    if (networkPatterns.some(pattern => message.includes(pattern) || name.includes(pattern))) {
      return true;
    }
  }

  // Check for TypeError with network indication (common in fetch failures)
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return true;
  }

  // Check string errors
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    return lowerError.includes('network') ||
           lowerError.includes('offline') ||
           lowerError.includes('connection');
  }

  // Check object with status indicating network issues
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.status === 0 || errorObj.status === 408) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if an error is an API-specific error
 * Identifies errors from Gemini, Claude/Anthropic, or general HTTP API errors
 */
export function isApiError(error: unknown): boolean {
  if (!error) return false;

  // Check Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // API error patterns
    const apiPatterns = [
      'api',
      'rate limit',
      'quota',
      '400',
      '401',
      '403',
      '404',
      '429',
      '500',
      '502',
      '503',
      'unauthorized',
      'forbidden',
      'invalid key',
      'api key',
      'gemini',
      'anthropic',
      'claude',
      'openai',
    ];

    if (apiPatterns.some(pattern => message.includes(pattern))) {
      return true;
    }
  }

  // Check string errors
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    return lowerError.includes('api') ||
           lowerError.includes('rate limit') ||
           lowerError.includes('unauthorized');
  }

  // Check object with HTTP status codes
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    const status = errorObj.status || errorObj.statusCode;
    if (typeof status === 'number' && status >= 400) {
      return true;
    }
    // Check for API-specific error structures
    if ('error' in errorObj || 'code' in errorObj || 'message' in errorObj) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if an error is related to AI content being blocked
 * Common with Gemini/Claude safety filters
 */
export function isContentBlockedError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = getErrorString(error).toLowerCase();

  const blockedPatterns = [
    'content blocked',
    'safety',
    'harmful',
    'blocked by',
    'content filter',
    'moderation',
    'policy violation',
    'inappropriate',
    'recitation',
  ];

  return blockedPatterns.some(pattern => errorStr.includes(pattern));
}

/**
 * Detects if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = getErrorString(error).toLowerCase();

  if (errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('quota')) {
    return true;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.status === 429 || errorObj.statusCode === 429) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Extracts a string representation from any error type
 */
function getErrorString(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj) {
      return String(errorObj.message);
    }
    if ('error' in errorObj) {
      return String(errorObj.error);
    }
    try {
      return JSON.stringify(error);
    } catch {
      return '[Object]';
    }
  }
  return String(error);
}

/**
 * Determines the error code based on error characteristics
 */
function determineErrorCode(error: unknown): ErrorCode {
  if (isContentBlockedError(error)) {
    return ErrorCodes.AI_CONTENT_BLOCKED;
  }
  if (isRateLimitError(error)) {
    return ErrorCodes.API_RATE_LIMIT;
  }
  if (isNetworkError(error)) {
    const errorStr = getErrorString(error).toLowerCase();
    if (errorStr.includes('timeout') || errorStr.includes('etimedout')) {
      return ErrorCodes.NETWORK_TIMEOUT;
    }
    if (errorStr.includes('offline')) {
      return ErrorCodes.NETWORK_OFFLINE;
    }
    return ErrorCodes.NETWORK_UNKNOWN;
  }
  if (isApiError(error)) {
    const errorStr = getErrorString(error).toLowerCase();
    if (errorStr.includes('401') || errorStr.includes('unauthorized') || errorStr.includes('invalid key')) {
      return ErrorCodes.API_INVALID_KEY;
    }
    if (errorStr.includes('400') || errorStr.includes('bad request')) {
      return ErrorCodes.API_BAD_REQUEST;
    }
    if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
      return ErrorCodes.API_SERVER_ERROR;
    }
    return ErrorCodes.API_UNKNOWN;
  }
  return ErrorCodes.UNKNOWN;
}

/**
 * Determines the severity based on error characteristics
 */
function determineSeverity(error: unknown, code: ErrorCode): ErrorSeverity {
  // Critical errors that need immediate attention
  if (code === ErrorCodes.API_INVALID_KEY) {
    return 'critical';
  }

  // Errors that can be retried
  if (
    code === ErrorCodes.NETWORK_TIMEOUT ||
    code === ErrorCodes.NETWORK_OFFLINE ||
    code === ErrorCodes.API_RATE_LIMIT ||
    code === ErrorCodes.API_SERVER_ERROR
  ) {
    return 'warning';
  }

  // Content blocked is a warning, user can modify prompt
  if (code === ErrorCodes.AI_CONTENT_BLOCKED) {
    return 'warning';
  }

  // Default to error
  return 'error';
}

/**
 * Main error handler - converts any error into a standardized AppError
 * @param error - The error to handle (can be any type)
 * @param context - Optional context string describing where the error occurred
 * @returns Standardized AppError object
 */
export function handleError(error: unknown, context?: string): AppError {
  const code = determineErrorCode(error);
  const severity = determineSeverity(error, code);
  const message = getErrorString(error);

  const appError: AppError = {
    message,
    severity,
    code,
    context,
    originalError: error,
    timestamp: new Date(),
  };

  return appError;
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Logs an AppError to the console with appropriate log level
 * Uses console.info, console.warn, or console.error based on severity
 */
export function logError(error: AppError): void {
  const prefix = error.context ? `[${error.context}]` : '[Error]';
  const codeStr = error.code ? ` (${error.code})` : '';
  const logMessage = `${prefix}${codeStr} ${error.message}`;

  switch (error.severity) {
    case 'info':
      console.info(logMessage);
      break;
    case 'warning':
      console.warn(logMessage);
      if (error.originalError && error.originalError !== error.message) {
        console.warn('Original error:', error.originalError);
      }
      break;
    case 'error':
    case 'critical':
      console.error(logMessage);
      if (error.originalError && error.originalError !== error.message) {
        console.error('Original error:', error.originalError);
      }
      break;
  }
}

/**
 * Combined handler and logger - handles the error and logs it in one call
 * @param error - The error to handle
 * @param context - Optional context string
 * @returns The standardized AppError
 */
export function handleAndLogError(error: unknown, context?: string): AppError {
  const appError = handleError(error, context);
  logError(appError);
  return appError;
}

// ============================================================================
// USER-FRIENDLY MESSAGE FORMATTING
// ============================================================================

/**
 * Formats an AppError into a user-friendly message suitable for display
 * Translates technical errors into understandable language
 */
export function formatErrorMessage(error: AppError): string {
  // Use error code to provide specific user-friendly messages
  switch (error.code) {
    case ErrorCodes.NETWORK_OFFLINE:
      return 'You appear to be offline. Please check your internet connection and try again.';

    case ErrorCodes.NETWORK_TIMEOUT:
      return 'The request timed out. Please check your connection and try again.';

    case ErrorCodes.NETWORK_UNKNOWN:
      return 'A network error occurred. Please check your connection and try again.';

    case ErrorCodes.API_RATE_LIMIT:
      return 'Too many requests. Please wait a moment before trying again.';

    case ErrorCodes.API_INVALID_KEY:
      return 'Invalid API key. Please check your API key in Settings.';

    case ErrorCodes.API_SERVER_ERROR:
      return 'The AI service is temporarily unavailable. Please try again in a few moments.';

    case ErrorCodes.API_BAD_REQUEST:
      return 'The request was invalid. Please check your input and try again.';

    case ErrorCodes.AI_CONTENT_BLOCKED:
      return 'The AI could not generate this content due to safety guidelines. Try modifying your prompt.';

    case ErrorCodes.AI_GENERATION_FAILED:
      return 'Failed to generate content. Please try again.';

    case ErrorCodes.AI_INVALID_RESPONSE:
      return 'Received an unexpected response from the AI. Please try again.';

    case ErrorCodes.APP_STORAGE_ERROR:
      return 'Failed to save data. Your browser storage may be full.';

    case ErrorCodes.APP_VALIDATION_ERROR:
      return 'Please check your input and try again.';

    default:
      // For unknown errors, try to provide a cleaner message
      if (error.message.length > 100) {
        return 'An unexpected error occurred. Please try again.';
      }
      return error.message;
  }
}

/**
 * Gets a short summary of the error suitable for toast notifications
 */
export function getErrorSummary(error: AppError): string {
  switch (error.code) {
    case ErrorCodes.NETWORK_OFFLINE:
    case ErrorCodes.NETWORK_TIMEOUT:
    case ErrorCodes.NETWORK_UNKNOWN:
      return 'Network Error';

    case ErrorCodes.API_RATE_LIMIT:
      return 'Rate Limited';

    case ErrorCodes.API_INVALID_KEY:
      return 'Invalid API Key';

    case ErrorCodes.API_SERVER_ERROR:
      return 'Server Error';

    case ErrorCodes.AI_CONTENT_BLOCKED:
      return 'Content Blocked';

    case ErrorCodes.AI_GENERATION_FAILED:
    case ErrorCodes.AI_INVALID_RESPONSE:
      return 'Generation Failed';

    default:
      return 'Error';
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Creates an AppError directly (for manually creating errors)
 */
export function createAppError(
  message: string,
  severity: ErrorSeverity = 'error',
  code?: ErrorCode,
  context?: string
): AppError {
  return {
    message,
    severity,
    code,
    context,
    timestamp: new Date(),
  };
}

/**
 * Type guard to check if an object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const errorObj = error as Record<string, unknown>;
  return (
    typeof errorObj.message === 'string' &&
    typeof errorObj.severity === 'string' &&
    ['info', 'warning', 'error', 'critical'].includes(errorObj.severity as string)
  );
}
