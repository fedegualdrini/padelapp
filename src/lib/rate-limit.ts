/**
 * Rate limiting for server actions and API endpoints
 * 
 * Uses in-memory sliding window algorithm with configurable limits.
 * Can be upgraded to Redis for distributed rate limiting in production.
 */

import { headers } from "next/headers";

/**
 * Rate limit configuration per endpoint type
 */
export const RATE_LIMITS = {
  // High-value mutations: match creation, editing
  match: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  // Invite creation and usage
  invite: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 requests per minute
  },
  // Event management (create, update, delete)
  event: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  // Player management
  player: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  // Venue management
  venue: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  // Attendance updates
  attendance: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  // Generic mutation default
  default: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * In-memory rate limit store
 * Uses sliding window algorithm for accurate rate limiting
 */
interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowMs));
    
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove timestamps older than the max window
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < maxWindow);
      // Remove empty entries
      if (entry.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets (in seconds) */
  reset: number;
  /** Unix timestamp when the oldest request in the window was made (in seconds) */
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier and endpoint type
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = "default"
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `${type}:${identifier}`;

  // Get or create entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Calculate remaining requests
  const currentCount = entry.timestamps.length;
  const remaining = Math.max(0, config.maxRequests - currentCount);

  // Calculate reset time (oldest timestamp + window duration)
  const oldestTimestamp = entry.timestamps[0] || now;
  const resetTime = Math.ceil((oldestTimestamp + config.windowMs) / 1000);

  // Check if rate limited
  if (currentCount >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
      retryAfter: Math.ceil((entry.timestamps[0]! + config.windowMs - now) / 1000),
    };
  }

  // Add current request timestamp
  entry.timestamps.push(now);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: remaining - 1,
    reset: resetTime,
  };
}

/**
 * Get client identifier for rate limiting
 * Uses IP address from headers, with fallback to a default
 */
export async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    
    // Try various headers that might contain the real IP
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
      // Take the first IP if there are multiple
      return forwarded.split(",")[0]!.trim();
    }
    
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp;
    }
    
    const cfIp = headersList.get("cf-connecting-ip");
    if (cfIp) {
      return cfIp;
    }
    
    // Fallback to anonymous identifier (not ideal, but better than nothing)
    return "anonymous";
  } catch {
    return "anonymous";
  }
}

/**
 * Rate limit error with standard 429 response data
 */
export class RateLimitError extends Error {
  public readonly limit: number;
  public readonly remaining: number;
  public readonly reset: number;
  public readonly retryAfter: number;

  constructor(result: RateLimitResult) {
    super(
      `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`
    );
    this.name = "RateLimitError";
    this.limit = result.limit;
    this.remaining = result.remaining;
    this.reset = result.reset;
    this.retryAfter = result.retryAfter ?? 60;
  }

  /**
   * Convert to a JSON-serializable object for server action responses
   */
  toJSON() {
    return {
      error: this.message,
      rateLimitExceeded: true,
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Higher-order function to wrap server actions with rate limiting
 * 
 * @example
 * ```ts
 * export const createMatchWithRateLimit = withRateLimit("match", createMatch);
 * ```
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  type: RateLimitType,
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const identifier = await getClientIdentifier();
    const result = checkRateLimit(identifier, type);

    if (!result.success) {
      throw new RateLimitError(result);
    }

    return action(...args);
  };
}

/**
 * Manually check and apply rate limit in server actions
 * Use this when you need more control over the rate limiting logic
 * 
 * @example
 * ```ts
 * export async function createMatch(formData: FormData) {
 *   await assertRateLimit("match");
 *   // ... rest of the action
 * }
 * ```
 */
export async function assertRateLimit(type: RateLimitType = "default"): Promise<void> {
  const identifier = await getClientIdentifier();
  const result = checkRateLimit(identifier, type);

  if (!result.success) {
    throw new RateLimitError(result);
  }
}

/**
 * Get rate limit info without consuming a request
 * Useful for showing rate limit status in UI
 */
export async function getRateLimitStatus(type: RateLimitType = "default"): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  const identifier = await getClientIdentifier();
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `${type}:${identifier}`;

  const entry = rateLimitStore.get(key);
  if (!entry) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  }

  // Filter timestamps to current window
  const currentTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
  const remaining = Math.max(0, config.maxRequests - currentTimestamps.length);
  const resetTime = Math.ceil(((currentTimestamps[0] || now) + config.windowMs) / 1000);

  return {
    limit: config.maxRequests,
    remaining,
    reset: resetTime,
  };
}
