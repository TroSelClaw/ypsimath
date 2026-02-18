'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'
import { MathContent } from '@/components/content/math-content'
import { SourceChips } from './source-chips'

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

interface MessageListProps {
  messages: UIMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <p className="text-2xl">🎓</p>
          <p className="text-lg font-medium">Hei! Hva lurer du på?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Forklar derivasjon', 'Hjelp meg med integraler', 'Hva er en grenseverdi?'].map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
              >
                {prompt}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((msg) => {
        const text = getTextContent(msg)
        const metadata = (msg.metadata as Record<string, unknown> | undefined) ?? {}
        const previewUrl = typeof metadata.imagePreviewUrl === 'string' ? metadata.imagePreviewUrl : null

        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {msg.role === 'assistant' ? (
                <>
                  <MathContent content={text} />
                  <SourceChips
                    sources={metadata?.sources as
                      | Array<{
                          id: string
                          topic: string
                          chapter: string
                          content_type: string
                        }>
                      | undefined}
                  />
                </>
              ) : (
                <div className="space-y-2">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Vedlagt bilde"
                      className="h-36 w-auto max-w-full rounded-md border border-primary-foreground/20 object-cover"
                    />
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm">{text}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted px-4 py-2.5">
            <span className="inline-flex gap-1">
              <span className="animate-bounce text-muted-foreground">●</span>
              <span className="animate-bounce text-muted-foreground [animation-delay:0.1s]">●</span>
              <span className="animate-bounce text-muted-foreground [animation-delay:0.2s]">●</span>
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
