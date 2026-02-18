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

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!conversation) return notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, image_url')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  const initialMessages = await Promise.all(
    (messages ?? []).map(async (m) => {
      let imagePreviewUrl: string | null = null

      if (m.image_url) {
        const { data: signed } = await supabase.storage
          .from('user-uploads')
          .createSignedUrl(m.image_url, 60 * 60)
        imagePreviewUrl = signed?.signedUrl ?? null
      }

      return {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imagePreviewUrl,
      }
    }),
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      <ConversationSidebar conversations={(conversations ?? []) as ConversationItem[]} />
      <ChatView conversationId={id} initialMessages={initialMessages} />
    </div>
  )
}
