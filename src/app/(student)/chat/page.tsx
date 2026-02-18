import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/chat/chat-view'
import {
  ConversationSidebar,
  type ConversationItem,
} from '@/components/chat/conversation-sidebar'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let conversations: ConversationItem[] = []
  if (user) {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('student_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(50)
    conversations = data ?? []
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      <ConversationSidebar conversations={conversations} />
      <ChatView />
    </div>
  )
}
