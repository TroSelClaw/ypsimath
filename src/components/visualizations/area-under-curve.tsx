'use client'

import { useMemo } from 'react'

import { Coordinates, Mafs, Plot, Polygon, Text, useMovablePoint } from 'mafs'

import 'mafs/core.css'

interface AreaUnderCurveProps {
  fn: (x: number) => number
  domain?: [number, number]
  xRange?: [number, number]
  yRange?: [number, number]
  samples?: number
  height?: number
}

const DEFAULT_DOMAIN: [number, number] = [-5, 5]
const DEFAULT_X_RANGE: [number, number] = [-5, 5]
const DEFAULT_Y_RANGE: [number, number] = [-5, 5]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildAreaPolygon(
  fn: (x: number) => number,
  start: number,
  end: number,
  samples: number,
): [number, number][] {
  const [left, right] = start <= end ? [start, end] : [end, start]
  const step = (right - left) / samples

  const top: [number, number][] = Array.from({ length: samples + 1 }, (_, index) => {
    const x = left + index * step
    return [x, fn(x)]
  })

  return [[left, 0], ...top, [right, 0]]
}

function trapezoidIntegral(fn: (x: number) => number, start: number, end: number, samples: number) {
  const [left, right] = start <= end ? [start, end] : [end, start]
  const step = (right - left) / samples

  let acc = 0
  for (let i = 0; i <= samples; i += 1) {
    const x = left + i * step
    const weight = i === 0 || i === samples ? 0.5 : 1
    acc += fn(x) * weight
  }

  return acc * step
}

export function AreaUnderCurve({
  fn,
  domain = DEFAULT_DOMAIN,
  xRange = DEFAULT_X_RANGE,
  yRange = DEFAULT_Y_RANGE,
  samples = 100,
  height = 320,
}: AreaUnderCurveProps) {
  const leftBound = useMovablePoint([-2, 0], {
    constrain: ([x]) => [clamp(x, domain[0], domain[1]), 0],
  })
  const rightBound = useMovablePoint([2, 0], {
    constrain: ([x]) => [clamp(x, domain[0], domain[1]), 0],
  })

  const polygon = useMemo(
    () => buildAreaPolygon(fn, leftBound.x, rightBound.x, samples),
    [fn, leftBound.x, rightBound.x, samples],
  )

  const area = useMemo(
    () => trapezoidIntegral(fn, leftBound.x, rightBound.x, samples),
    [fn, leftBound.x, rightBound.x, samples],
  )

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
        <Polygon points={polygon} fillOpacity={0.3} color="var(--chart-2)" />
        {leftBound.element}
        {rightBound.element}
        <Text x={(leftBound.x + rightBound.x) / 2} y={0.75} attach="n" color="var(--foreground)">
          {`A \approx ${area.toFixed(3)}`}
        </Text>
      </Mafs>
      <p className="text-sm text-muted-foreground">
        Flytt grensepunktene med mus/touch eller tastaturpilene.
      </p>
    </section>
  )
}
