/**
 * Typed error classes for YpsiMath.
 * All user-facing messages in Norwegian.
 */

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class AuthError extends AppError {
  constructor(message = 'Du er ikke logget inn.') {
    super(message, 401, 'AUTH_ERROR')
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Du har ikke tilgang til denne ressursen.') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>

  constructor(message = 'Ugyldig data.', fieldErrors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressursen ble ikke funnet.') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(`For mange forespørsler. Prøv igjen om ${retryAfterSeconds} sekunder.`, 429, 'RATE_LIMIT')
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}
