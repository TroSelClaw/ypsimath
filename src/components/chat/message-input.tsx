'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageAttach } from './image-attach'

interface MessageInputProps {
  input: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  imagePreviewUrl: string | null
  isUploadingImage: boolean
  imageError: string | null
  onSelectImage: (file: File | null) => void
  onClearImage: () => void
}

export function MessageInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  imagePreviewUrl,
  isUploadingImage,
  imageError,
  onSelectImage,
  onClearImage,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !isUploadingImage) {
        onSubmit()
      }
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-2">
        <ImageAttach
          previewUrl={imagePreviewUrl}
          isUploading={isUploadingImage}
          error={imageError}
          onSelectFile={onSelectImage}
          onClear={onClearImage}
        />

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv et spørsmål..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`
            }}
          />
          <Button
            size="icon"
            onClick={onSubmit}
            disabled={!input.trim() || isLoading || isUploadingImage}
            aria-label="Send melding"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
