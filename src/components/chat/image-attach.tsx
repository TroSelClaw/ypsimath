'use client'

import { Camera, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageAttachProps {
  previewUrl: string | null
  isUploading: boolean
  error: string | null
  onSelectFile: (file: File | null) => void
  onClear: () => void
}

export function ImageAttach({ previewUrl, isUploading, error, onSelectFile, onClear }: ImageAttachProps) {
  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Valgt bilde"
            className="h-20 w-20 rounded-md border border-border object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onClear}
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            aria-label="Fjern bilde"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
          />
          <span className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <Camera className="h-4 w-4" />
            Legg ved bilde
          </span>
        </label>

        {isUploading ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Laster opp…
          </span>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
