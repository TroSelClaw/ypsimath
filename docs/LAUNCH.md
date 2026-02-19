# YpsiMath — LAUNCH.md

Denne sjekklisten brukes for produksjonssetting av YpsiMath.

## 1) Infrastruktur og kontoer

- [ ] **Supabase Pro** aktivert for produksjonsprosjekt (EU-region).
- [ ] Storage buckets verifisert: `user-uploads` (private), `exam-pdfs` (private), `videos` (public/controlled via signed URL der relevant).
- [ ] `pgvector` aktivert og migrasjoner kjørt til og med `0010_user_feedback.sql`.
- [ ] Vercel prosjekt opprettet og koblet til GitHub-repo.

## 2) Domene og TLS

- [ ] Egendefinert domene lagt til i Vercel.
- [ ] DNS (A/CNAME) peker korrekt.
- [ ] HTTPS/sertifikat aktivt (Let's Encrypt via Vercel).
- [ ] Redirect-regler (www/non-www) satt.

## 3) Miljøvariabler (Vercel Production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] `ANTHROPIC_API_KEY` (hvis brukes for scripts)
- [ ] `SENTRY_DSN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_APP_URL`

## 4) Sikkerhet og personvern

- [ ] `next.config.ts` headers aktive i produksjon (CSP, CORS, frame/clickjacking-beskyttelse).
- [ ] RLS-audit kjørt: `supabase/tests/security_rls_audit.sql`.
- [ ] API-auth kontrakttest grønn (`src/app/api/__tests__/api-auth-contract.test.ts`).
- [ ] Cookie-banner og personvernside verifisert i prod.
- [ ] DPA/DPIA-dokumenter oppdatert (`docs/dpa-log.md`, `docs/dpia.md`).

## 5) Observability

- [ ] Sentry events mottas fra server + client + edge.
- [ ] Alert-regler aktivert (new issue, 500-spike, P95 > 3s).
- [ ] `/admin/helse` viser data i produksjon.
- [ ] Vercel Analytics viser Core Web Vitals.

## 6) Test før launch

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm exec vitest run`
- [ ] `pnpm exec playwright test` (prod-testmiljø)
- [ ] Lighthouse CI > 90 på definerte sider.
- [ ] Accessibility baseline grønn.

## 7) Soft launch (lærer først)

- [ ] Lærer onboardet og har aktiv klasse.
- [ ] Minst 3 tema publisert med teori/regler/eksempler/øvelser/flashcards.
- [ ] Semesterplan satt opp.
- [ ] Lærer bruker løsningen i minimum 1 uke.
- [ ] Kritiske funn logget og håndtert.

## 8) Student launch

- [ ] Elevinvitasjoner sendt.
- [ ] Beredskap for første uke satt (hvem følger opp, responstid).
- [ ] Incident response-plan delt med ansvarlige.

## 9) Incident response (hurtigkort)

1. Bekreft omfang (brukere/feature).
2. Sjekk Sentry + `/admin/helse` + Vercel logs.
3. Midlertidig tiltak (feature toggle/rollback).
4. Kommuniser status + ETA.
5. Post-mortem med tiltak og oppfølging.

---

## Kjørereferanse

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm exec playwright test
```

```bash
# valgfritt: sikkerhets- og ytelsessjekk i CI
# lighthouse workflow + security audit scripts
```
