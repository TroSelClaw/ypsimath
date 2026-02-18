import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ExampleBlock } from '@/components/wiki/example-block'
import { RuleBlock } from '@/components/wiki/rule-block'
import { TheoryBlock } from '@/components/wiki/theory-block'
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
  content: string
}

export default async function WikiTopicPage({ params }: { params: Promise<Params> }) {
  const { subject, topic } = await params
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('content_elements')
    .select('id,title,chapter,topic,sort_order,content_type,content')
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
            return <ExampleBlock key={item.id} title={item.title} content={item.content} />
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
