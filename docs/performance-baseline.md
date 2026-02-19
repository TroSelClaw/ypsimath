# Performance Baseline (TASK-070)

Dato: 2026-02-19
Miljø: lokal dev/VPS (ikke produksjon)
Verktøy: Lighthouse CI (`lighthouse-ci.yml` + `lighthouserc.json`)

## Målverdier

- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90
- **LCP**: < 2.5s
- **CLS**: < 0.1

## Sider i baseline-scope

- `/`
- `/wiki/r1`
- `/chat`
- `/fremgang`
- `/flashcards`

## Optimaliseringer gjort i TASK-070

1. **Lighthouse CI workflow**
   - Ny GitHub Actions workflow: `.github/workflows/lighthouse-ci.yml`.
   - Kjører på PR mot `main` + manuelt (`workflow_dispatch`).

2. **Lighthouse konfigurasjon**
   - Ny `lighthouserc.json` med audits + terskler for score, LCP og CLS.

3. **Bundle analyzer-støtte**
   - `next.config.ts` bruker `@next/bundle-analyzer` bak env-flagget `ANALYZE=true`.
   - Brukes for å identifisere store chunks (>200kB gzipped mål).

## Videre oppfølging

- Kjør Lighthouse i staging/produksjonslignende miljø og dokumenter faktiske score per side.
- Verifiser at tunge klientbibliotek (Pyodide, Mafs, video) ikke lekker inn i initial bundle.
- Prioriter sider med svakeste LCP/CLS i neste optimaliseringsrunde.
