interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, LoginAttempt> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly WINDOW_DURATION = 10 * 60 * 1000; // 10 minutes window

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if login attempt is allowed
   */
  isAllowed(identifier: string): { allowed: boolean; remainingTime?: number; message?: string } {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      return { allowed: true };
    }

    // Check if currently blocked
    if (attempt.blockedUntil > now) {
      const remainingTime = Math.ceil((attempt.blockedUntil - now) / 1000 / 60);
      return {
        allowed: false,
        remainingTime,
        message: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
      };
    }

    // Check if within window and exceeded max attempts
    if (attempt.count >= this.MAX_ATTEMPTS && now - attempt.lastAttempt < this.WINDOW_DURATION) {
      attempt.blockedUntil = now + this.BLOCK_DURATION;
      this.attempts.set(identifier, attempt);

      const remainingTime = Math.ceil(this.BLOCK_DURATION / 1000 / 60);
      return {
        allowed: false,
        remainingTime,
        message: `Too many failed attempts. Account blocked for ${remainingTime} minutes.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

    // Reset count if outside window
    if (now - attempt.lastAttempt > this.WINDOW_DURATION) {
      attempt.count = 0;
    }

    attempt.count += 1;
    attempt.lastAttempt = now;

    this.attempts.set(identifier, attempt);
  }

  /**
   * Record a successful login (resets the counter)
   */
  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get current status for debugging
   */
  getStatus(identifier: string): LoginAttempt | null {
    return this.attempts.get(identifier) || null;
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      // Remove entries that are not blocked and haven't been active recently
      if (attempt.blockedUntil < now && now - attempt.lastAttempt > this.WINDOW_DURATION * 2) {
        this.attempts.delete(key);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();


