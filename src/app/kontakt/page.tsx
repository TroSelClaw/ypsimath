export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Kontakt</h1>
      <p className="text-muted-foreground">
        Har du spørsmål om undervisning, innhold eller tekniske problemer i YpsiMath?
      </p>

      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Kontaktlærer (testmiljø)</p>
        <p className="mt-1 font-medium">test.laerer@ypsimath.test</p>
      </div>

      <p className="text-sm text-muted-foreground">
        For feil i appen: bruk også knappen <strong>Tilbakemelding</strong> nederst i grensesnittet.
      </p>
    </main>
  )
}
