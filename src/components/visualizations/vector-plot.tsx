'use client'

import { Coordinates, Line, Mafs, Point, Text, vec } from 'mafs'

import 'mafs/core.css'

type Vector2 = [number, number]

interface VectorPlotProps {
  vectorA: Vector2
  vectorB: Vector2
  xRange?: [number, number]
  yRange?: [number, number]
  height?: number
  labelA?: string
  labelB?: string
  labelResult?: string
}

const DEFAULT_X_RANGE: [number, number] = [-6, 6]
const DEFAULT_Y_RANGE: [number, number] = [-6, 6]

export function VectorPlot({
  vectorA,
  vectorB,
  xRange = DEFAULT_X_RANGE,
  yRange = DEFAULT_Y_RANGE,
  height = 320,
  labelA = '\\vec{a}',
  labelB = '\\vec{b}',
  labelResult = '\\vec{a}+\\vec{b}',
}: VectorPlotProps) {
  const result = vec.add(vectorA, vectorB)

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

        <Line.Segment point1={[0, 0]} point2={vectorA} color="var(--chart-1)" />
        <Line.Segment point1={[0, 0]} point2={vectorB} color="var(--chart-4)" />
        <Line.Segment point1={[0, 0]} point2={result} color="var(--chart-3)" />

        <Line.Segment point1={vectorA} point2={result} color="var(--chart-4)" style="dashed" />
        <Line.Segment point1={vectorB} point2={result} color="var(--chart-1)" style="dashed" />

        <Point x={vectorA[0]} y={vectorA[1]} color="var(--chart-1)" />
        <Point x={vectorB[0]} y={vectorB[1]} color="var(--chart-4)" />
        <Point x={result[0]} y={result[1]} color="var(--chart-3)" />

        <Text x={vectorA[0]} y={vectorA[1]} attach="n" color="var(--foreground)">
          {labelA}
        </Text>
        <Text x={vectorB[0]} y={vectorB[1]} attach="n" color="var(--foreground)">
          {labelB}
        </Text>
        <Text x={result[0]} y={result[1]} attach="n" color="var(--foreground)">
          {labelResult}
        </Text>
      </Mafs>

      <p className="text-sm text-muted-foreground">
        vektor a = ({vectorA[0]}, {vectorA[1]}), vektor b = ({vectorB[0]}, {vectorB[1]}), sum = ({result[0]}, {result[1]})
      </p>
    </section>
  )
}
