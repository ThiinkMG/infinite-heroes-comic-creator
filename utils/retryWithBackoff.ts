/**
 * Retry utility with exponential backoff for API calls
 *
 * Features:
 * - Exponential backoff (delay doubles each attempt)
 * - Maximum delay cap
 * - Configurable retry predicate (e.g., only retry on network errors)
 * - Jitter to prevent thundering herd problem
 *
 * @module utils/retryWithBackoff
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay cap in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Optional predicate to determine if error should trigger retry */
  retryOn?: (error: unknown) => boolean;
  /** Optional callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryOn' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Adds random jitter to delay to prevent thundering herd
 * Jitter is +/- 25% of the delay
 *
 * @param delayMs - Base delay in milliseconds
 * @returns Delay with random jitter applied
 */
function addJitter(delayMs: number): number {
  const jitterFactor = 0.25;
  const jitter = delayMs * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(delayMs + jitter));
}

/**
 * Calculates the delay for a given attempt number with exponential backoff
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param initialDelayMs - Initial delay in milliseconds
 * @param maxDelayMs - Maximum delay cap in milliseconds
 * @param backoffMultiplier - Multiplier for exponential growth
 * @returns Delay in milliseconds with jitter applied
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  // Calculate base delay: initialDelay * multiplier^(attempt-1)
  const baseDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  // Cap at maximum delay
  const cappedDelay = Math.min(baseDelay, maxDelayMs);
  // Add jitter to prevent thundering herd
  return addJitter(cappedDelay);
}

/**
 * Sleep utility that returns a promise resolving after specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default retry predicate - retries on network errors and rate limits
 *
 * @param error - The error to check
 * @returns true if the error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return true;
    }

    // Rate limiting (429)
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }

    // Temporary unavailability
    if (message.includes('temporarily unavailable') || message.includes('service unavailable')) {
      return true;
    }
  }

  // Handle response-like objects with status codes
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;

    // Check for status property (e.g., fetch Response errors)
    if (typeof errorObj.status === 'number') {
      const status = errorObj.status;
      // Retry on rate limits (429) and server errors (5xx)
      if (status === 429 || (status >= 500 && status < 600)) {
        return true;
      }
    }

    // Check for statusCode property (some API clients use this)
    if (typeof errorObj.statusCode === 'number') {
      const statusCode = errorObj.statusCode;
      if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Executes a function with automatic retry using exponential backoff
 *
 * @template T - Return type of the function
 * @param fn - Async function to execute
 * @param options - Configuration options for retry behavior
 * @returns Promise resolving to the function's return value
 * @throws The last error encountered if all retries are exhausted
 *
 * @example
 * ```typescript
 * // Basic usage with defaults
 * const result = await retryWithBackoff(() => fetchData());
 *
 * // With custom options
 * const result = await retryWithBackoff(
 *   () => callApi(),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 500,
 *     retryOn: (error) => error instanceof NetworkError,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
  } = { ...DEFAULT_OPTIONS, ...options };

  const retryOn = options?.retryOn ?? isRetryableError;
  const onRetry = options?.onRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      const shouldRetry = retryOn(error);

      // If this was the last attempt or error is not retryable, throw
      if (attempt === maxAttempts || !shouldRetry) {
        throw error;
      }

      // Calculate delay for this retry
      const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier);

      // Invoke callback if provided
      if (onRetry) {
        onRetry(attempt, error, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Creates a wrapped version of an async function with retry logic baked in
 *
 * @template T - Arguments tuple type
 * @template R - Return type
 * @param fn - Async function to wrap
 * @param options - Configuration options for retry behavior
 * @returns Wrapped function with automatic retry
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(
 *   async (url: string) => fetch(url).then(r => r.json()),
 *   { maxAttempts: 3 }
 * );
 *
 * const data = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export function withRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: RetryOptions
): (...args: T) => Promise<R> {
  return (...args: T) => retryWithBackoff(() => fn(...args), options);
}

export default retryWithBackoff;
