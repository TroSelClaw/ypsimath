'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { DefaultChatTransport, type UIMessage } from 'ai'

interface ChatViewProps {
  conversationId?: string
  initialMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>
}

export function ChatView({ conversationId, initialMessages }: ChatViewProps) {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages?.map<UIMessage>((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: 'text', text: m.content }],
    })),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  function handleSubmit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
  }

  return (
    <div className="flex flex-1 flex-col">
      <MessageList messages={messages} isLoading={isLoading} />

      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Noe gikk galt. Prøv igjen.
        </div>
      )}

      <MessageInput
        input={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
