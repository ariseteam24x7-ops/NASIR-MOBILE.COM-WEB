export interface LoginRateLimiterOptions {
  windowMs?: number;
  maxAttempts?: number;
  maxEntries?: number;
  now?: () => number;
}

export function createLoginRateLimiter(options: LoginRateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const maxAttempts = options.maxAttempts ?? 5;
  const maxEntries = options.maxEntries ?? 10000;
  const now = options.now ?? Date.now;

  const attempts = new Map<string, { count: number; windowStart: number }>();

  return {
    keyFor(ip: string, email: string) {
      return `${ip || 'unknown'}:${email.trim().toLowerCase()}`;
    },

    retryAfter(key: string): number {
      const current = now();

      for (const [entryKey, entry] of attempts) {
        if (current - entry.windowStart >= windowMs) {
          attempts.delete(entryKey);
        }
      }

      const entry = attempts.get(key);
      if (!entry || entry.count < maxAttempts) return 0;

      return Math.max(1, Math.ceil(
        (entry.windowStart + windowMs - current) / 1000
      ));
    },

    recordFailure(key: string) {
      const current = now();
      let entry = attempts.get(key);

      if (!entry || current - entry.windowStart >= windowMs) {
        entry = { count: 0, windowStart: current };
      }

      entry.count += 1;
      attempts.delete(key);
      attempts.set(key, entry);

      while (attempts.size > maxEntries) {
        const oldest = attempts.keys().next().value;
        if (oldest === undefined) break;
        attempts.delete(oldest);
      }
    },

    clear(key: string) {
      attempts.delete(key);
    },

    get size() {
      return attempts.size;
    },
  };
}
