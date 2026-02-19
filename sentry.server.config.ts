import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.user) {
      event.user = {
        id: event.user.id,
      }
    }

    if (event.request?.headers) {
      delete event.request.headers.cookie
      delete event.request.headers.authorization
    }

    return event
  },
})
