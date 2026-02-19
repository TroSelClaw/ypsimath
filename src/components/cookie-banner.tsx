'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'ypsimath-cookie-consent-v1'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = window.localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          Vi bruker kun nødvendige sesjons-cookies for innlogging og sikker drift. Ingen sporingscookies i MVP.
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(CONSENT_KEY, 'accepted')
            setVisible(false)
          }}
          className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
        >
          OK, skjønner
        </button>
      </div>
    </div>
  )
}
