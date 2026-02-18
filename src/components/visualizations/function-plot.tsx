'use client'

import { Coordinates, LaTeX, Mafs, Plot } from 'mafs'

import 'mafs/core.css'

interface FunctionPlotProps {
  fn: (x: number) => number
  domain?: [number, number]
  xRange?: [number, number]
  yRange?: [number, number]
  xLabel?: string
  yLabel?: string
  height?: number
}

interface ParametricPlotProps {
  xy: (t: number) => [number, number]
  parameterDomain?: [number, number]
  xRange?: [number, number]
  yRange?: [number, number]
  xLabel?: string
  yLabel?: string
  height?: number
}

const DEFAULT_DOMAIN: [number, number] = [-5, 5]
const DEFAULT_X_RANGE: [number, number] = [-5, 5]
const DEFAULT_Y_RANGE: [number, number] = [-5, 5]

export function FunctionPlot({
  fn,
  domain = DEFAULT_DOMAIN,
  xRange = DEFAULT_X_RANGE,
  yRange = DEFAULT_Y_RANGE,
  xLabel = 'x',
  yLabel = 'y',
  height = 320,
}: FunctionPlotProps) {
  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <Mafs
        height={height}
        viewBox={{
          x: xRange,
          y: yRange,
        }}
      >
        <Coordinates.Cartesian />
        <Plot.OfX y={fn} domain={domain} />
        <LaTeX tex={xLabel} at={[xRange[1] - 0.5, 0.5]} />
        <LaTeX tex={yLabel} at={[0.5, yRange[1] - 0.5]} />
      </Mafs>
    </section>
  )
}

export function ParametricPlot({
  xy,
  parameterDomain = [0, Math.PI * 2],
  xRange = DEFAULT_X_RANGE,
  yRange = DEFAULT_Y_RANGE,
  xLabel = 'x',
  yLabel = 'y',
  height = 320,
}: ParametricPlotProps) {
  return (
    <section className="space-y-2 rounded-lg border bg-card p-3">
      <Mafs
        height={height}
        viewBox={{
          x: xRange,
          y: yRange,
        }}
      >
        <Coordinates.Cartesian />
        <Plot.Parametric xy={xy} domain={parameterDomain} />
        <LaTeX tex={xLabel} at={[xRange[1] - 0.5, 0.5]} />
        <LaTeX tex={yLabel} at={[0.5, yRange[1] - 0.5]} />
      </Mafs>
    </section>
  )
}
