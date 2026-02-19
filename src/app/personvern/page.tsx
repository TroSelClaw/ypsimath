export default function PersonvernPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Personvern</h1>
        <p className="text-sm text-muted-foreground">Sist oppdatert: 19.02.2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Hva lagres</h2>
        <p>
          YpsiMath lagrer kun data som trengs for læring: kontoinformasjon, aktivitet i appen,
          prøvebesvarelser og læringsprogresjon.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Hva brukes data til</h2>
        <p>
          Data brukes til å gi deg riktig innhold, vise progresjon, og støtte lærerens vurderingsarbeid.
          AI-funksjoner får kun nødvendig kontekst.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Dine rettigheter</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Du kan be om innsyn i data om deg.</li>
          <li>Du kan be om retting av feil data.</li>
          <li>Du kan be om sletting av konto og tilhørende data.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Lagringstid</h2>
        <p>
          Opplastede bilder slettes automatisk etter 90 dager. Øvrige data lagres så lenge kontoen er aktiv,
          eller til sletting er gjennomført.
        </p>
      </section>
    </main>
  )
}
