# Observability (TASK-074)

## Sentry-oppsett

YpsiMath bruker `@sentry/nextjs` med separate config-filer for:

- `sentry.server.config.ts`
- `sentry.client.config.ts`
- `sentry.edge.config.ts`

### PII-regel

`beforeSend` filtrerer bort PII:

- Beholder kun `event.user.id`
- Fjerner `cookie` og `authorization`-headere
- Ingen e-post eller navn sendes til Sentry

## Source maps og releases

`next.config.ts` bruker `withSentryConfig` med:

- source map upload aktivert
- release-navn: `SENTRY_RELEASE` eller `VERCEL_GIT_COMMIT_SHA`
- auto-finalize av release ved deploy

Dette gjør at hver Vercel deploy får egen Sentry-release.

## Anbefalte alert-regler i Sentry

Opprett disse tre reglene i Sentry-prosjektet:

1. **Nye feil**
   - Trigger: `The event's level is error` + `The issue is first seen`
   - Action: send Slack/epost til drift

2. **Spike i 500-feil**
   - Trigger: error rate > baseline (f.eks. 3x over 10 min)
   - Filter: transaction eller endpoint-tag for API-ruter

3. **P95 responstid over 3s**
   - Trigger: performance alert på `p95(transaction.duration) > 3000ms` i 10 min

## Vercel Analytics

`src/app/layout.tsx` inkluderer `<Analytics />` fra `@vercel/analytics/react`.

Følg med på CWV i Vercel:

- LCP
- FID/INP
- CLS

## Admin helse-side

- Rute: `/admin/helse`
- Viser:
  - DB round-trip
  - API responstid (representative backend-spørringer)
  - Feilrate siste 24t (fra `activity_log`)
  - Aktive brukere siste 24t
