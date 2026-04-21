/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise}
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry on 4xx errors (except 429 - rate limit)
      if (
        error.response?.status >= 400 &&
        error.response?.status < 500 &&
        error.response?.status !== 429
      ) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs,
      );

      // Add some jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      const totalDelay = delay + jitter;

      if (onRetry) {
        onRetry(attempt + 1, totalDelay, error);
      }

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(totalDelay)}ms...`,
        error.message,
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
};
