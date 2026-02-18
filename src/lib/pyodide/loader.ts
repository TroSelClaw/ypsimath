const PYODIDE_SCRIPT_ID = 'pyodide-script'
const PYODIDE_SCRIPT_SRC = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js'

export interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>
  runPython: (code: string) => unknown
  loadPackage: (names: string | string[]) => Promise<void>
  setStdout: (options: { batched: (output: string) => void }) => void
  setStderr: (options: { batched: (output: string) => void }) => void
}

let pyodidePromise: Promise<PyodideInstance> | null = null

function ensurePyodideScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Pyodide kan kun lastes i nettleseren.'))
  }

  const existing = document.getElementById(PYODIDE_SCRIPT_ID) as HTMLScriptElement | null
  if (existing?.dataset.loaded === 'true') {
    return Promise.resolve()
  }

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Klarte ikke å laste Pyodide-script.')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = PYODIDE_SCRIPT_ID
    script.src = PYODIDE_SCRIPT_SRC
    script.async = true
    script.crossOrigin = 'anonymous'

    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }

    script.onerror = () => {
      reject(new Error('Klarte ikke å laste Pyodide-script.'))
    }

    document.head.appendChild(script)
  })
}

export async function loadPyodideRuntime(): Promise<PyodideInstance> {
  if (pyodidePromise) {
    return pyodidePromise
  }

  pyodidePromise = (async () => {
    await ensurePyodideScript()

    const loader = (window as unknown as { loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInstance> })
      .loadPyodide

    if (!loader) {
      throw new Error('Pyodide-loader ble ikke funnet i nettleseren.')
    }

    const pyodide = await loader({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/',
    })

    await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`)

    return pyodide
  })()

  return pyodidePromise
}
