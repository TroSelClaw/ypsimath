/**
 * In-memory sliding window rate limiter.
 * Suitable for MVP (50 users). Upgrade to Upstash Redis for scale.
 */

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  /** Seconds until the oldest request in the window expires */
  retryAfterSeconds: number
  /** Remaining requests in the current window */
  remaining: number
}

const store = new Map<string, number[]>()

// Periodic cleanup to prevent memory leaks (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store.entries()) {
    const filtered = timestamps.filter((t) => now - t < 3600000) // keep last hour
    if (filtered.length === 0) {
      store.delete(key)
    } else {
      store.set(key, filtered)
    }
  }
}, 300000)

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Get existing timestamps and filter to current window
  const timestamps = (store.get(key) || []).filter((t) => t > windowStart)

  if (timestamps.length >= config.maxRequests) {
    const oldestInWindow = timestamps[0]!
    const retryAfterMs = oldestInWindow + config.windowMs - now
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    }
  }

  // Record this request
  timestamps.push(now)
  store.set(key, timestamps)

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: config.maxRequests - timestamps.length,
  }
}

// Pre-defined rate limit configs from PRD
export const RATE_LIMITS = {
  auth: { maxRequests: 10, windowMs: 60000 } as RateLimitConfig,
  chat: { maxRequests: 30, windowMs: 3600000 } as RateLimitConfig,
  imageUpload: { maxRequests: 20, windowMs: 3600000 } as RateLimitConfig,
  examGrading: { maxRequests: 5, windowMs: 3600000 } as RateLimitConfig,
  practiceExam: { maxRequests: 5, windowMs: 86400000 } as RateLimitConfig,
  recommendations: { maxRequests: 1, windowMs: 3600000 } as RateLimitConfig,
} as const
