'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'
import { MathContent } from '@/components/content/math-content'
import { SourceChips } from './source-chips'

/** Extract text content from UIMessage parts */
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
        <div className="text-center space-y-3">
          <p className="text-2xl">🎓</p>
          <p className="text-lg font-medium">Hei! Hva lurer du på?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Forklar derivasjon',
              'Hjelp meg med integraler',
              'Hva er en grenseverdi?',
            ].map((prompt) => (
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const text = getTextContent(msg)
        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.role === 'assistant' ? (
                <>
                  <MathContent content={text} />
                  <SourceChips
                    sources={
                      (msg.metadata as Record<string, unknown> | undefined)
                        ?.sources as
                        | Array<{
                            id: string
                            topic: string
                            chapter: string
                            content_type: string
                          }>
                        | undefined
                    }
                  />
                </>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{text}</p>
              )}
            </div>
          </div>
        )
      })}

      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl px-4 py-2.5">
            <span className="inline-flex gap-1">
              <span className="animate-bounce text-muted-foreground">●</span>
              <span className="animate-bounce text-muted-foreground [animation-delay:0.1s]">
                ●
              </span>
              <span className="animate-bounce text-muted-foreground [animation-delay:0.2s]">
                ●
              </span>
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
