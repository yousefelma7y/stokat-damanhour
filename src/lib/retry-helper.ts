/**
 * Retry helper for handling transient failures in serverless environments
 *
 * Common use cases:
 * - Database connection failures during cold starts
 * - Network timeouts
 * - Rate limiting
 */

export interface RetryOptions {
  retries?: number;
  delay?: number;
  backoff?: boolean;
}

/**
 * Executes a function with retry logic
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 *
 * @example
 * const data = await withRetry(() => Order.find(filter), { retries: 3 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = true } = options;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;

      // Don't retry on validation errors or client errors (4xx)
      if (
        error.name === "ValidationError" ||
        error.name === "CastError" ||
        (error.statusCode && error.statusCode >= 400 && error.statusCode < 500)
      ) {
        throw error;
      }

      if (isLastAttempt) {
        console.error(`❌ Failed after ${retries} attempts:`, error.message);
        throw error;
      }

      // Calculate wait time with exponential backoff if enabled
      const waitTime = backoff ? delay * Math.pow(2, i) : delay;
      console.warn(
        `⚠️ Attempt ${i + 1}/${retries} failed, retrying in ${waitTime}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Retry logic failed unexpectedly");
}

/**
 * Wraps a promise with a timeout
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns The result of the promise or throws timeout error
 *
 * @example
 * const data = await withTimeout(
 *   Order.find(filter).populate(...),
 *   9000,
 *   'Order fetch timed out'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 9000,
  errorMessage = "Operation timed out",
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
  );

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Combines retry and timeout logic
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param retryOptions - Retry configuration
 * @returns The result of the function
 *
 * @example
 * const data = await withRetryAndTimeout(
 *   () => Order.find(filter),
 *   8000,
 *   { retries: 2 }
 * );
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 9000,
  retryOptions: RetryOptions = {},
): Promise<T> {
  return withRetry(() => withTimeout(fn(), timeoutMs), retryOptions);
}
