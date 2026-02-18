'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { createSemesterPlan, type SemesterPlanActionState } from '@/app/actions/semester-plan'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TeacherClass = {
  id: string
  name: string
  subject_id: string
  school_year: string
}

type WizardScheduleDay = {
  weekday: number
  label: string
  enabled: boolean
  startTime: string
  durationMinutes: number
}

type Assessment = {
  title: string
  type: 'full_day_exam' | 'half_day_exam' | 'short_quiz'
  week: number
}

type Holiday = {
  date: string
  name: string
}

const DEFAULT_WEEKDAYS: WizardScheduleDay[] = [
  { weekday: 1, label: 'Mandag', enabled: false, startTime: '08:30', durationMinutes: 90 },
  { weekday: 2, label: 'Tirsdag', enabled: false, startTime: '08:30', durationMinutes: 90 },
  { weekday: 3, label: 'Onsdag', enabled: false, startTime: '08:30', durationMinutes: 90 },
  { weekday: 4, label: 'Torsdag', enabled: false, startTime: '08:30', durationMinutes: 90 },
  { weekday: 5, label: 'Fredag', enabled: false, startTime: '08:30', durationMinutes: 90 },
]

const NORWEGIAN_HOLIDAYS_2026_2027: Holiday[] = [
  { date: '2026-12-25', name: 'Første juledag' },
  { date: '2026-12-26', name: 'Andre juledag' },
  { date: '2027-01-01', name: 'Nyttårsdag' },
  { date: '2027-03-25', name: 'Skjærtorsdag' },
  { date: '2027-03-26', name: 'Langfredag' },
  { date: '2027-03-28', name: 'Første påskedag' },
  { date: '2027-03-29', name: 'Andre påskedag' },
  { date: '2027-05-01', name: 'Arbeidernes dag' },
  { date: '2027-05-06', name: 'Kristi himmelfartsdag' },
  { date: '2027-05-16', name: 'Første pinsedag' },
  { date: '2027-05-17', name: 'Grunnlovsdag' },
  { date: '2027-05-17', name: 'Andre pinsedag' },
]

const TOPIC_SUGGESTIONS = [
  'Funksjoner',
  'Polynomfunksjoner',
  'Rasjonale funksjoner',
  'Derivasjon',
  'Derivasjonsregler',
  'Ekstremalpunkter',
  'Integrasjon',
  'Arealberegning',
  'Vektorer i planet',
  'Trigonometriske funksjoner',
]

const STORAGE_KEY = 'ypsimath-semester-wizard-v1'

type WizardPersistedState = {
  step: number
  classId: string
  subjectId: string
  startDate: string
  endDate: string
  weekdays: WizardScheduleDay[]
  holidays: Holiday[]
  assessments: Assessment[]
  topics: string[]
}

function loadInitialState(classes: TeacherClass[]): WizardPersistedState {
  const fallback: WizardPersistedState = {
    step: 1,
    classId: classes[0]?.id ?? '',
    subjectId: classes[0]?.subject_id ?? 'r1',
    startDate: '',
    endDate: '',
    weekdays: DEFAULT_WEEKDAYS,
    holidays: NORWEGIAN_HOLIDAYS_2026_2027,
    assessments: [],
    topics: TOPIC_SUGGESTIONS,
  }

  if (typeof window === 'undefined') return fallback

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as Partial<WizardPersistedState>
    return {
      step: parsed.step ?? fallback.step,
      classId: parsed.classId ?? fallback.classId,
      subjectId: parsed.subjectId ?? fallback.subjectId,
      startDate: parsed.startDate ?? fallback.startDate,
      endDate: parsed.endDate ?? fallback.endDate,
      weekdays: parsed.weekdays?.length ? parsed.weekdays : fallback.weekdays,
      holidays: parsed.holidays?.length ? parsed.holidays : fallback.holidays,
      assessments: parsed.assessments ?? fallback.assessments,
      topics: parsed.topics?.length ? parsed.topics : fallback.topics,
    }
  } catch {
    return fallback
  }
}

function persistWizardState(payload: WizardPersistedState) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function SemesterPlanWizard({ classes }: { classes: TeacherClass[] }) {
  const [state, action, pending] = useActionState<SemesterPlanActionState, FormData>(createSemesterPlan, {})

  const initial = loadInitialState(classes)

  const [step, setStep] = useState(initial.step)
  const [classId, setClassId] = useState(initial.classId)
  const [subjectId, setSubjectId] = useState(initial.subjectId)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [weekdays, setWeekdays] = useState<WizardScheduleDay[]>(initial.weekdays)
  const [holidays, setHolidays] = useState<Holiday[]>(initial.holidays)
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>(initial.assessments)
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [assessmentType, setAssessmentType] = useState<Assessment['type']>('short_quiz')
  const [assessmentWeek, setAssessmentWeek] = useState(40)
  const [topics, setTopics] = useState(initial.topics)

  const activeDays = useMemo(() => weekdays.filter((day) => day.enabled), [weekdays])

  useEffect(() => {
    persistWizardState({
      step,
      classId,
      subjectId,
      startDate,
      endDate,
      weekdays,
      holidays,
      assessments,
      topics,
    })
  }, [step, classId, subjectId, startDate, endDate, weekdays, holidays, assessments, topics])

  function updateWeekday(weekday: number, patch: Partial<WizardScheduleDay>) {
    setWeekdays((days) => days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)))
  }

  function addHoliday() {
    if (!newHolidayDate || !newHolidayName.trim()) return
    setHolidays((prev) => [...prev, { date: newHolidayDate, name: newHolidayName.trim() }].sort((a, b) => a.date.localeCompare(b.date)))
    setNewHolidayDate('')
    setNewHolidayName('')
  }

  function addAssessment() {
    if (!assessmentTitle.trim()) return
    setAssessments((prev) => [
      ...prev,
      { title: assessmentTitle.trim(), type: assessmentType, week: assessmentWeek },
    ])
    setAssessmentTitle('')
  }

  function moveTopic(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= topics.length) return
    setTopics((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
  }

  function removeTopic(index: number) {
    setTopics((prev) => prev.filter((_, i) => i !== index))
  }

  function canAdvance(currentStep: number) {
    switch (currentStep) {
      case 1:
        return Boolean(classId && startDate && endDate)
      case 2:
        return activeDays.length > 0
      case 3:
      case 4:
        return true
      case 5:
        return topics.length > 0
      default:
        return false
    }
  }

  const payload = JSON.stringify({
    classId,
    subjectId,
    startDate,
    endDate,
    scheduleDays: activeDays.map(({ weekday, startTime, durationMinutes }) => ({ weekday, startTime, durationMinutes })),
    holidays,
    assessments,
    topics,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semesterplan-veiviser</CardTitle>
        <CardDescription>Steg {step} av 5</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        {step === 1 && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Klasse</label>
              <select
                value={classId}
                onChange={(e) => {
                  const selected = classes.find((c) => c.id === e.target.value)
                  setClassId(e.target.value)
                  if (selected) setSubjectId(selected.subject_id)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.school_year})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Startdato</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sluttdato</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            {weekdays.map((day) => (
              <div key={day.weekday} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateWeekday(day.weekday, { enabled: e.target.checked })}
                  />
                  {day.label}
                </label>
                <Input
                  type="time"
                  value={day.startTime}
                  disabled={!day.enabled}
                  onChange={(e) => updateWeekday(day.weekday, { startTime: e.target.value })}
                />
                <Input
                  type="number"
                  min={30}
                  max={240}
                  value={day.durationMinutes}
                  disabled={!day.enabled}
                  onChange={(e) => updateWeekday(day.weekday, { durationMinutes: Number(e.target.value) || 90 })}
                />
              </div>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
              <Input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} />
              <Input placeholder="Navn på fridag/hendelse" value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} />
              <Button type="button" variant="outline" onClick={addHoliday}>Legg til</Button>
            </div>
            <ul className="space-y-2 text-sm">
              {holidays.map((holiday) => (
                <li key={`${holiday.date}-${holiday.name}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{holiday.date} — {holiday.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setHolidays((prev) => prev.filter((h) => !(h.date === holiday.date && h.name === holiday.name)))}
                  >
                    Fjern
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <Input placeholder="F.eks. Terminprøve 1" value={assessmentTitle} onChange={(e) => setAssessmentTitle(e.target.value)} />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as Assessment['type'])}
              >
                <option value="short_quiz">Kortprøve</option>
                <option value="half_day_exam">Halvdagsprøve</option>
                <option value="full_day_exam">Heldagsprøve</option>
              </select>
              <Input type="number" min={1} max={53} value={assessmentWeek} onChange={(e) => setAssessmentWeek(Number(e.target.value) || 1)} />
              <Button type="button" variant="outline" onClick={addAssessment}>Legg til</Button>
            </div>
            <ul className="space-y-2 text-sm">
              {assessments.map((assessment, index) => (
                <li key={`${assessment.title}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{assessment.title} — uke {assessment.week}</span>
                  <Button type="button" variant="ghost" onClick={() => setAssessments((prev) => prev.filter((_, i) => i !== index))}>Fjern</Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                placeholder="Legg til tema"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const value = e.currentTarget.value.trim()
                  if (!value) return
                  setTopics((prev) => [...prev, value])
                  e.currentTarget.value = ''
                }}
              />
              <p className="text-sm text-muted-foreground">Trykk Enter for å legge til</p>
            </div>
            <ul className="space-y-2">
              {topics.map((topic, index) => (
                <li key={`${topic}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{index + 1}. {topic}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => moveTopic(index, -1)}>↑</Button>
                    <Button type="button" variant="outline" onClick={() => moveTopic(index, 1)}>↓</Button>
                    <Button type="button" variant="ghost" onClick={() => removeTopic(index)}>Fjern</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <form action={action} className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || pending}>
            Tilbake
          </Button>
          <input type="hidden" name="payload" value={payload} />
          {step < 5 ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={!canAdvance(step) || pending}>
              Neste
            </Button>
          ) : (
            <Button type="submit" disabled={!canAdvance(step) || pending}>
              {pending ? 'Genererer plan...' : 'Generer plan'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
