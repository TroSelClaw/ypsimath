# YpsiMath brukertestguide (TASK-075)

## Mål
Validere at elev- og lærerflytene fungerer i praksis med lav friksjon før produksjonslansering.

## Deltakere
- 1 lærer
- 5–10 elever (testkontoer)

## Praktisk oppsett
1. Kjør `npx tsx scripts/seed-test-data.ts`.
2. Del ut testkontoer til elever og lærer.
3. Sørg for at testklassen **R1 Brukertestklasse** er synlig i lærergrensesnittet.
4. Sett av 35–45 minutter.

## Oppgaver for elever
1. Logg inn og åpne **Fremgang**.
2. Finn «Neste tema» og gå inn på temaet.
3. Les teori/regler og åpne minst ett eksempel.
4. Løs én oppgave (hint + fasit + selvrapport).
5. Åpne **Chat** og still et fagspørsmål.
6. Kjør én runde i **Flashcards**.
7. Send tilbakemelding via knappen **Tilbakemelding** (NPS + tekst).

## Oppgaver for lærer
1. Logg inn og åpne dashboard.
2. Sjekk heatmap + varsler.
3. Åpne en elevdetalj og lagre et lærernotat.
4. Generer AI-vurderingsrapport og rediger teksten.
5. Åpne **Semesterplan** og verifiser kommende tema.
6. Åpne **Prøver** og verifiser statuskort/handlinger.
7. Send tilbakemelding via **Tilbakemelding**.

## Hva vi måler
- Tid til første nyttige handling (elev + lærer)
- Antall steder deltakerne stopper opp
- Subjektiv score (NPS 0–10)
- Fritekst: «Hva fungerer bra?» / «Hva er frustrerende?»

## Feilhåndtering under test
- **P0**: blocker (innlogging/lagring/sidekrasj) → stopp test for deltaker, fiks før ny runde.
- **P1**: alvorlig UX-problem, men mulig å fullføre → logg og fiks før launch.
- **P2**: kosmetikk/tekst/spacing → logg til etter launch.

## Exit-kriterier før launch
- Ingen åpne **P0**
- Ingen åpne **P1** i kjerneflytene (wiki, chat, fremgang, lærerdashboard)
- Minst 8 av 10 deltakere fullfører oppgavene uten hjelp
