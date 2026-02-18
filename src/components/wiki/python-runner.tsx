'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { loadPyodideRuntime } from '@/lib/pyodide/loader'

interface PythonRunnerProps {
  code: string
}

export function PythonRunner({ code }: PythonRunnerProps) {
  const [runtimeReady, setRuntimeReady] = useState(false)
  const [script, setScript] = useState(code)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [plotBase64, setPlotBase64] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const ensureRuntime = async () => {
    const pyodide = await loadPyodideRuntime()
    if (script.includes('matplotlib')) {
      await pyodide.loadPackage('matplotlib')
    }
    setRuntimeReady(true)
    return pyodide
  }

  const runCode = () => {
    startTransition(async () => {
      setError(null)
      setOutput('')
      setPlotBase64(null)

      try {
        const pyodide = await ensureRuntime()
        const stdoutChunks: string[] = []
        const stderrChunks: string[] = []

        pyodide.setStdout({
          batched: (text: string) => stdoutChunks.push(text),
        })
        pyodide.setStderr({
          batched: (text: string) => stderrChunks.push(text),
        })

        const originalFetch = window.fetch
        window.fetch = async () => {
          throw new Error('Nettverk er deaktivert i Python-sandkassen.')
        }

        try {
          await pyodide.runPythonAsync(script)

          const encodedPlot = await pyodide.runPythonAsync(`
import base64
_plot_base64 = None
try:
    import matplotlib.pyplot as plt
    figures = [plt.figure(num) for num in plt.get_fignums()]
    if figures:
        buffer = __import__('io').BytesIO()
        figures[-1].savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        _plot_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close('all')
except Exception:
    _plot_base64 = None
_plot_base64
`)

          if (typeof encodedPlot === 'string' && encodedPlot.length > 0) {
            setPlotBase64(encodedPlot)
          }
        } finally {
          window.fetch = originalFetch
        }

        const stderr = stderrChunks.join('').trim()
        if (stderr.length > 0) {
          setError(stderr)
        }

        const stdout = stdoutChunks.join('').trim()
        setOutput(stdout.length > 0 ? stdout : 'Kjøring fullført uten tekstlig output.')
      } catch (runError) {
        setError(runError instanceof Error ? runError.message : 'Ukjent feil under kjøring.')
      }
    })
  }

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">Python-utforskning</h3>
        <p className="text-sm text-muted-foreground">
          Kjør kode lokalt i nettleseren med Pyodide. Nettverk er deaktivert under kjøring.
        </p>
      </header>

      <textarea
        value={script}
        onChange={(event) => setScript(event.target.value)}
        className="min-h-48 w-full rounded-md border bg-background p-3 font-mono text-sm"
        spellCheck={false}
      />

      <div className="flex items-center gap-2">
        <Button type="button" onClick={runCode} disabled={isPending}>
          {isPending ? 'Kjører…' : 'Kjør kode'}
        </Button>
        {runtimeReady ? <span className="text-xs text-muted-foreground">Pyodide lastet</span> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : null}

      {!error && output ? (
        <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{output}</pre>
      ) : null}

      {plotBase64 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Plot</p>
          <Image
            src={`data:image/png;base64,${plotBase64}`}
            alt="Generert matplotlib-plot"
            width={1024}
            height={768}
            unoptimized
            className="max-h-96 w-full rounded-md border object-contain"
          />
        </div>
      ) : null}
    </section>
  )
}
