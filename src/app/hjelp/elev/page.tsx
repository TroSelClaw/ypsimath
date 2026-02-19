import Link from 'next/link'

export default function ElevHjelpPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Hjelp for elever</h1>
        <p className="text-muted-foreground">
          Kort guide til hvordan du bruker wiki, chat, oppgaver og flashcards i YpsiMath.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1) Wiki</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Start med teori og regler i temaet ditt.</li>
          <li>Åpne eksempler for stegvis løsning.</li>
          <li>Bruk «Vis hint» før «Vis fasit» for best læringseffekt.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2) Chat-tutor</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Still konkrete spørsmål (f.eks. «Hvorfor blir derivert av ln(x) lik 1/x?»).</li>
          <li>Be om hint og delsteg, ikke bare svar.</li>
          <li>Last opp bilde av utregning ved behov.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3) Flashcards</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Ta en kort økt daglig (5–10 minutter).</li>
          <li>Vurder ærlig: Husket / Nesten / Glemte.</li>
          <li>Systemet planlegger neste repetisjon automatisk.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Vanlige spørsmål (FAQ)</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Hvordan bytter jeg tema? → Bruk Fremgang-siden og velg planet.</li>
          <li>Hvor ser jeg målene mine? → Åpne Profil.</li>
          <li>Hva betyr «i rute»? → Du følger semesterplanen.</li>
          <li>Kan jeg bruke chat på norsk? → Ja, chat svarer på norsk.</li>
          <li>Hvordan rapporterer jeg feil? → Bruk «Tilbakemelding»-knappen i appen.</li>
        </ol>
      </section>

      <p className="text-sm text-muted-foreground">
        Trenger du mer hjelp? Gå til <Link href="/kontakt" className="underline">kontakt</Link>.
      </p>
    </main>
  )
}
