'use client'

import { useMemo } from 'react'

import { Coordinates, Line, Mafs, Plot, Text, useMovablePoint } from 'mafs'

import 'mafs/core.css'

interface TangentExplorerProps {
  fn: (x: number) => number
  derivative: (x: number) => number
  domain?: [number, number]
  xRange?: [number, number]
  yRange?: [number, number]
  step?: number
  height?: number
}

const DEFAULT_DOMAIN: [number, number] = [-5, 5]
const DEFAULT_X_RANGE: [number, number] = [-5, 5]
const DEFAULT_Y_RANGE: [number, number] = [-5, 5]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function TangentExplorer({
  fn,
  derivative,
  domain = DEFAULT_DOMAIN,
  xRange = DEFAULT_X_RANGE,
  yRange = DEFAULT_Y_RANGE,
  step = 0.25,
  height = 320,
}: TangentExplorerProps) {
  const movable = useMovablePoint([0, fn(0)], {
    constrain: (point) => {
      const nextX = clamp(point[0], domain[0], domain[1])
      const snappedX = Math.round(nextX / step) * step
      return [snappedX, fn(snappedX)]
    },
  })

  const x = movable.x
  const y = movable.y
  const slope = useMemo(() => derivative(x), [derivative, x])

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
        <Line.PointSlope point={[x, y]} slope={slope} color="var(--primary)" />
        {movable.element}
        <Text x={x} y={y} attach="n" color="var(--foreground)">
          {`f'(${x.toFixed(2)}) = ${slope.toFixed(3)}`}
        </Text>
      </Mafs>

      <p className="text-sm text-muted-foreground">
        Flytt punktet med mus/touch eller tastaturpilene. x={x.toFixed(2)}, y={y.toFixed(2)}, f&apos;(x)={slope.toFixed(3)}
      </p>
    </section>
  )
}
