import { MathContent } from '@/components/content/math-content'
import { VideoPlayer } from '@/components/wiki/video-player'

interface ExampleBlockProps {
  title: string
  content: string
  video?: {
    id: string
    thumbnail_url: string | null
    duration_seconds: number | null
  } | null
}

export function ExampleBlock({ title, content, video }: ExampleBlockProps) {
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-lg font-semibold">Eksempel: {title} (Vis løsning)</summary>
      <div className="mt-3">
        <MathContent content={content} />
        {video ? (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Video-forklaring</h4>
            <VideoPlayer
              videoId={video.id}
              thumbnailUrl={video.thumbnail_url}
              durationSeconds={video.duration_seconds}
            />
          </div>
        ) : null}
      </div>
    </details>
  )
}
