'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { createClient } from '@/lib/supabase/client'

interface ChatViewProps {
  conversationId?: string
  initialMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    imagePreviewUrl?: string | null
  }>
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function extensionFromType(type: string) {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export function ChatView({ conversationId, initialMessages }: ChatViewProps) {
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages?.map<UIMessage>((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: 'text', text: m.content }],
      metadata: m.imagePreviewUrl ? { imagePreviewUrl: m.imagePreviewUrl } : undefined,
    })),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  function clearSelectedImage() {
    if (selectedImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImagePreview)
    }
    setSelectedImage(null)
    setSelectedImagePreview(null)
    setImageError(null)
  }

  function handleSelectImage(file: File | null) {
    setImageError(null)

    if (!file) {
      clearSelectedImage()
      return
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setImageError('Kun JPEG, PNG og WEBP støttes.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setImageError('Bildet er for stort. Maks størrelse er 10 MB.')
      return
    }

    if (selectedImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImagePreview)
    }

    setSelectedImage(file)
    setSelectedImagePreview(URL.createObjectURL(file))
  }

  async function uploadSelectedImage(messageId: string): Promise<{ storagePath: string; signedUrl: string } | null> {
    if (!selectedImage) return null

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Du må være innlogget for å laste opp bilde.')
    }

    const ext = extensionFromType(selectedImage.type)
    const storagePath = `${user.id}/chat/${messageId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(storagePath, selectedImage, {
        cacheControl: '3600',
        upsert: false,
        contentType: selectedImage.type,
      })

    if (uploadError) {
      throw new Error('Kunne ikke laste opp bildet.')
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('user-uploads')
      .createSignedUrl(storagePath, 60 * 60)

    if (signedError || !signedData?.signedUrl) {
      throw new Error('Kunne ikke klargjøre forhåndsvisning av bildet.')
    }

    return {
      storagePath,
      signedUrl: signedData.signedUrl,
    }
  }

  async function handleSubmit() {
    const text = input.trim()
    if (!text || isLoading || isUploadingImage) return

    setImageError(null)
    setIsUploadingImage(true)

    const messageId = crypto.randomUUID()

    try {
      let imageUpload: { storagePath: string; signedUrl: string } | null = null
      if (selectedImage) {
        imageUpload = await uploadSelectedImage(messageId)
      }

      sendMessage({
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text }],
        metadata: imageUpload ? { imagePreviewUrl: imageUpload.signedUrl } : undefined,
      }, {
        body: {
          conversationId,
          imageUrl: imageUpload?.storagePath,
        },
      })

      setInput('')
      clearSelectedImage()
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Kunne ikke laste opp bildet.'
      setImageError(message)
    } finally {
      setIsUploadingImage(false)
    }
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
        imagePreviewUrl={selectedImagePreview}
        isUploadingImage={isUploadingImage}
        imageError={imageError}
        onSelectImage={handleSelectImage}
        onClearImage={clearSelectedImage}
      />
    </div>
  )
}
