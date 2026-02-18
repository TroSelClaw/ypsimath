import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  const config = { maxRequests: 3, windowMs: 1000 }

  beforeEach(() => {
    // Use unique keys per test to avoid cross-test pollution
  })

  it('allows requests under the limit', () => {
    const key = 'test-allow-' + Date.now()
    const r1 = rateLimit(key, config)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit(key, config)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
  })

  it('blocks requests over the limit', () => {
    const key = 'test-block-' + Date.now()
    rateLimit(key, config)
    rateLimit(key, config)
    rateLimit(key, config)

    const r4 = rateLimit(key, config)
    expect(r4.allowed).toBe(false)
    expect(r4.retryAfterSeconds).toBeGreaterThan(0)
    expect(r4.remaining).toBe(0)
  })
})
