# DPIA (Data Protection Impact Assessment)

Dato: 2026-02-19
System: YpsiMath

## Formål

YpsiMath behandler elevdata for å støtte læring, progresjonsanalyse og vurderingsstøtte.

## Datakategorier

- Kontoidentitet (id, e-post, rolle)
- Læringsaktivitet (wiki, oppgaver, chat-metadata)
- Prøvedata (besvarelse, score, tilbakemelding)
- Lærernotater

## Risikovurdering

- Uautorisert tilgang til elevdata → mitigert med RLS i Supabase
- Overdeling til LLM-leverandører → mitigert med ZDR og aggregerte prompts
- For lang lagring av bildeopplastinger → mitigert med 90 dagers retention-policy

## Tiltak

- RLS på alle elevrelaterte tabeller
- Signed URLs for video/bilde
- Kontosletting med kaskade + utsatt purge som opsjon
- Dataminimering i AI-prompts

## Rest-risiko

Moderat, akseptabel for pilot i skolekontekst med løpende revisjon.