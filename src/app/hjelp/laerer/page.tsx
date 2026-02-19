import Link from 'next/link'

export default function LaererHjelpPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Hjelp for lærere</h1>
        <p className="text-muted-foreground">
          Praktisk guide til klasseoppsett, semesterplan, prøver og elevoppfølging.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1) Klasseoppsett</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Opprett klasse under «Klasse / ny».</li>
          <li>Legg til elever med e-post eller invitasjon.</li>
          <li>Bekreft at alle elever ligger i riktig klasse.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2) Semesterplan</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Kjør veiviseren for datoer, undervisningsdager og vurderinger.</li>
          <li>Juster rekkefølge og lagre versjon.</li>
          <li>Følg avvik i dashboard-widgeten for å oppdage elever bak plan.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3) Prøver og vurdering</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Opprett prøve i prøvegeneratoren.</li>
          <li>Eksporter PDF og del med klassen.</li>
          <li>Bruk resultatsiden for overstyring og CSV-eksport.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4) Elevoppfølging</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Bruk heatmap for rask oversikt over svakere områder.</li>
          <li>Åpne elevdetalj for notater og AI-vurderingsrapport.</li>
          <li>Flagg innhold i lærerens innholdsvisning ved feil/mangler.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Hvordan bytter jeg rolle på en bruker? → Admin → Brukere.</li>
          <li>Hva gjør jeg ved feil i AI-retting? → Overstyr score i resultatvisning.</li>
          <li>Hvor ser jeg systemhelse? → Admin → Helse.</li>
          <li>Hvordan melder jeg forbedringsønsker? → «Tilbakemelding»-knappen i appen.</li>
          <li>Hvordan tar jeg backup? → Følg driftsrutiner dokumentert i prosjektet.</li>
        </ol>
      </section>

      <p className="text-sm text-muted-foreground">
        Trenger du støtte? Se <Link href="/kontakt" className="underline">kontakt</Link>.
      </p>
    </main>
  )
}
