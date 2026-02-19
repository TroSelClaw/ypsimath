# TASK-073 — Security checklist (pre-launch)

Dato: 2026-02-19

## 1) RLS-verifikasjon (Supabase)

- [x] Alle apptabeller har RLS aktivert (`rowsecurity = true`)
- [x] SQL-audit-script lagt til: `supabase/tests/security_rls_audit.sql`
- [x] Storage-policy-sjekk lagt inn for `user-uploads` med path-scope per `auth.uid()`

Kjør:

```bash
supabase db test --local --file supabase/tests/security_rls_audit.sql
```

## 2) API-autentisering

- [x] Alle `/api/*` routes krever autentisering
- [x] Ny `requireApiUser()`-guard i `src/lib/auth/api-auth.ts`
- [x] Automatisert kontraktstest lagt til: `src/app/api/__tests__/api-auth-contract.test.ts`

Kjør:

```bash
npx vitest run src/app/api/__tests__/api-auth-contract.test.ts
```

## 3) Storage scope (`user-uploads/[userId]/`)

- [x] Upload-rute skriver kun til `user.id`-prefiks
- [x] Policy-audit for bucket ligger i SQL-testscript

## 4) CORS + CSP

- [x] `next.config.ts` setter CORS-headere for `/api/:path*`
- [x] Tillatt origin begrenses til `NEXT_PUBLIC_APP_URL` (fallback `https://ypsimath.no`)
- [x] CSP aktiv globalt med eksplisitt `frame-src`, `object-src 'none'`, `frame-ancestors 'none'`

## 5) Secrets hygiene

- [x] Ingen hardkodede API-nøkler i kode (hurtigsøk utført)
- [x] GitHub secret scanning anbefales aktivert på repo-nivå

Hurtigsøk:

```bash
rg -n "(sk_live|service_role|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|GEMINI_API_KEY)" src docs scripts
```

## 6) Rate limits (staging-verifisering)

- [x] Chat/image/exam-limiter fortsatt aktiv via `lib/rate-limit.ts`
- [x] Spot-verifisert med eksisterende unit tests og API-ruter
- [ ] Full staging burn-in (manuell) før launch

Forslag staging-test:

1. Kjør 31 chat-kall innen 1 time for samme bruker → forvent 429
2. Kjør 21 image-check kall innen 1 time → forvent 429
3. Kjør 6 exam-grade kall innen 1 time → forvent 429
