'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TooltipTourProps {
  role: string
}

interface TourStep {
  title: string
  description: string
  href: string
  cta: string
}

function getSteps(role: string): TourStep[] {
  if (role === 'teacher' || role === 'admin') {
    return [
      {
        title: 'Steg 1: Sett opp semesterplan',
        description: 'Gå til semesterplan og bekreft datoer + rekkefølge på tema.',
        href: '/laerer/semesterplan/ny',
        cta: 'Åpne semesterplan',
      },
      {
        title: 'Steg 2: Sjekk klasseoversikt',
        description: 'Bruk dashboardet for å se varselkort, heatmap og elever som trenger støtte.',
        href: '/laerer',
        cta: 'Åpne oversikt',
      },
      {
        title: 'Steg 3: Prøver og vurdering',
        description: 'Opprett en prøve og åpne resultatsiden for vurdering.',
        href: '/laerer/prover',
        cta: 'Åpne prøver',
      },
    ]
  }

  return [
    {
      title: 'Steg 1: Les tema i wiki',
      description: 'Start med teori og regler. Åpne eksempelblokkene for stegvis løsning.',
      href: '/wiki',
      cta: 'Åpne wiki',
    },
    {
      title: 'Steg 2: Spør chat-tutor',
      description: 'Still spørsmål når du står fast, og be om hint framfor fasit.',
      href: '/chat',
      cta: 'Åpne chat',
    },
    {
      title: 'Steg 3: Repeter med flashcards',
      description: 'Ta en kort økt daglig for å holde stoffet aktivt i minnet.',
      href: '/flashcards',
      cta: 'Åpne flashcards',
    },
  ]
}

export function TooltipTour({ role }: TooltipTourProps) {
  const storageKey = useMemo(() => `ypsimath-tour-dismissed-${role}`, [role])
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = useMemo(() => getSteps(role), [role])

  useEffect(() => {
    setMounted(true)
    const alreadyDismissed = window.localStorage.getItem(storageKey) === '1'
    setDismissed(alreadyDismissed)
  }, [storageKey])

  if (!mounted || dismissed) return null

  const step = steps[stepIndex]

  return (
    <div className="fixed top-20 right-4 z-50 w-80 rounded-xl border bg-background p-4 shadow-lg md:right-6">
      <p className="text-xs font-medium text-muted-foreground">
        Onboarding {stepIndex + 1}/{steps.length}
      </p>
      <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
      <div className="mt-3 flex gap-2">
        <Button asChild size="sm">
          <Link href={step.href}>{step.cta}</Link>
        </Button>
        {stepIndex < steps.length - 1 ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setStepIndex((prev) => prev + 1)}>
            Neste
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              window.localStorage.setItem(storageKey, '1')
              setDismissed(true)
            }}
          >
            Ferdig
          </Button>
        )}
      </div>
    </div>
  )
}
