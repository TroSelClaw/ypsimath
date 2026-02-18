import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/chat/chat-view'
import {
  ConversationSidebar,
  type ConversationItem,
} from '@/components/chat/conversation-sidebar'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatConversationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!conversation) return notFound()

  // Load messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Load conversation list
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      <ConversationSidebar conversations={(conversations ?? []) as ConversationItem[]} />
      <ChatView
        conversationId={id}
        initialMessages={
          (messages ?? []).map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        }
      />
    </div>
  )
}
