import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ExampleBlock } from '@/components/wiki/example-block'
import { ExerciseBlock } from '@/components/wiki/exercise-block'
import { PythonRunner } from '@/components/wiki/python-runner'
import { RuleBlock } from '@/components/wiki/rule-block'
import { TheoryBlock } from '@/components/wiki/theory-block'
import { WikiViewLogger } from '@/components/wiki/wiki-view-logger'
import { createClient } from '@/lib/supabase/server'

interface Params {
  subject: string
  topic: string
}

interface ContentRow {
  id: string
  title: string
  chapter: string
  topic: string
  sort_order: number
  content_type: 'theory' | 'rule' | 'example' | 'exercise' | 'exploration' | 'flashcard'
  exercise_format: 'freeform' | 'multiple_choice' | 'numeric_input' | 'drag_drop' | 'interactive' | null
  content: string
  content_metadata: {
    hints?: string[]
    answer?: string | number
    tolerance?: number
    choices?: string[]
    solution?: string
    pythonCode?: string
  } | null
}

export default async function WikiTopicPage({ params }: { params: Promise<Params> }) {
  const { subject, topic } = await params
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('content_elements')
    .select('id,title,chapter,topic,sort_order,content_type,exercise_format,content,content_metadata')
    .eq('subject_id', subject)
    .eq('topic', topic)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  if (!rows || rows.length === 0) {
    notFound()
  }

  const contentRows = rows as ContentRow[]
  const chapter = contentRows[0].chapter

  const exampleIds = contentRows.filter((row) => row.content_type === 'example').map((row) => row.id)

  const videosByContentId = new Map<
    string,
    { id: string; thumbnail_url: string | null; duration_seconds: number | null }
  >()

  if (exampleIds.length > 0) {
    const { data: videos } = await supabase
      .from('videos')
      .select('id, content_element_id, thumbnail_url, duration_seconds, status')
      .in('content_element_id', exampleIds)
      .eq('status', 'ready')

    for (const video of videos ?? []) {
      if (!videosByContentId.has(video.content_element_id as string)) {
        videosByContentId.set(video.content_element_id as string, {
          id: video.id as string,
          thumbnail_url: (video.thumbnail_url as string | null) ?? null,
          duration_seconds: (video.duration_seconds as number | null) ?? null,
        })
      }
    }
  }

  const { data: topicRows } = await supabase
    .from('content_elements')
    .select('topic')
    .eq('subject_id', subject)
    .eq('status', 'published')
    .order('topic', { ascending: true })

  const topics = Array.from(new Set((topicRows ?? []).map((r) => r.topic as string)))
  const currentIndex = topics.indexOf(topic)
  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null
  const nextTopic = currentIndex >= 0 && currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/wiki">Fag</Link> {' / '}
        <Link href={`/wiki/${subject}`}>{subject.toUpperCase()}</Link> {' / '}
        <span>{chapter}</span> {' / '}
        <span className="font-medium text-foreground">{topic}</span>
      </nav>

      <WikiViewLogger subjectId={subject} topic={topic} />

      <header>
        <h1 className="text-3xl font-semibold">{topic}</h1>
        <p className="text-sm text-muted-foreground">Fag: {subject.toUpperCase()}</p>
      </header>

      <section className="space-y-4">
        {contentRows.map((item) => {
          if (item.content_type === 'theory') {
            return <TheoryBlock key={item.id} title={item.title} content={item.content} />
          }

          if (item.content_type === 'rule') {
            return <RuleBlock key={item.id} title={item.title} content={item.content} />
          }

          if (item.content_type === 'example') {
            return (
              <ExampleBlock
                key={item.id}
                title={item.title}
                content={item.content}
                video={videosByContentId.get(item.id) ?? null}
              />
            )
          }

          if (item.content_type === 'exercise') {
            return (
              <ExerciseBlock
                key={item.id}
                id={item.id}
                title={item.title}
                content={item.content}
                format={item.exercise_format ?? 'freeform'}
                metadata={item.content_metadata}
              />
            )
          }

          if (item.content_type === 'exploration') {
            const initialCode = item.content_metadata?.pythonCode ?? item.content

            return <PythonRunner key={item.id} code={initialCode} />
          }

          return null
        })}
      </section>

      <footer className="flex items-center justify-between border-t pt-4 text-sm">
        <div>
          {prevTopic ? <Link href={`/wiki/${subject}/${prevTopic}`}>← Forrige tema</Link> : <span />}
        </div>
        <div>{nextTopic ? <Link href={`/wiki/${subject}/${nextTopic}`}>Neste tema →</Link> : <span />}</div>
      </footer>
    </div>
  )
}
