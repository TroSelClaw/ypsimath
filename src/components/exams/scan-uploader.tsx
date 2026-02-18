'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { StudentPageMapper, type StudentMapping } from './student-page-mapper'
import { startExamGrading } from '@/app/actions/exam-submissions'

interface Student {
  id: string
  display_name: string
  email: string
}

interface Props {
  examId: string
  students: Student[]
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart <= bEnd && bStart <= aEnd
}

export function ScanUploader({ examId, students }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [scanPath, setScanPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const [mappings, setMappings] = useState<StudentMapping[]>(
    students.map((s) => ({
      studentId: s.id,
      studentName: s.display_name,
      studentEmail: s.email,
      startPage: '',
      endPage: '',
    })),
  )

  const assignedCount = useMemo(
    () => mappings.filter((m) => m.startPage !== '' && m.endPage !== '').length,
    [mappings],
  )

  const validationError = useMemo(() => {
    const filled = mappings.filter((m) => m.startPage !== '' && m.endPage !== '')
    for (const m of filled) {
      if ((m.startPage as number) > (m.endPage as number)) return `${m.studentName}: startside er større enn sluttside.`
    }
    for (let i = 0; i < filled.length; i++) {
      for (let j = i + 1; j < filled.length; j++) {
        if (
          overlaps(
            filled[i].startPage as number,
            filled[i].endPage as number,
            filled[j].startPage as number,
            filled[j].endPage as number,
          )
        ) {
          return `Overlappende sideintervall mellom ${filled[i].studentName} og ${filled[j].studentName}.`
        }
      }
    }
    return null
  }, [mappings])

  const handleUpload = async () => {
    if (!file) return
    setError(null)
    if (file.type !== 'application/pdf') {
      setError('Kun PDF er tillatt.')
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('Filen er for stor (maks 200MB).')
      return
    }

    setUploading(true)
    try {
      const supabase = createBrowserClient()
      const path = `exams/${examId}/scan.pdf`
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' })

      if (uploadError) throw uploadError
      setScanPath(path)
      setStatus('PDF lastet opp.')
    } catch {
      setError('Kunne ikke laste opp PDF.')
    } finally {
      setUploading(false)
    }
  }

  const handleStartGrading = async () => {
    setError(null)
    setStatus(null)
    if (!scanPath) {
      setError('Last opp skannet PDF først.')
      return
    }
    if (assignedCount !== students.length) {
      setError('Alle elever må ha tildelt sideintervall før retting kan starte.')
      return
    }
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const result = await startExamGrading({
      examId,
      scanPath,
      mappings: mappings.map((m) => ({
        studentId: m.studentId,
        startPage: m.startPage,
        endPage: m.endPage,
      })),
    })

    if (result.error) {
      setError(result.error)
    } else {
      setStatus('Rettejobb startet. Innleveringer er opprettet.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1) Last opp skannet PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Laster opp…' : 'Last opp PDF'}
          </Button>
          {scanPath && <p className="text-xs text-muted-foreground">Lagret som: user-uploads/{scanPath}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Tildel sider til elever</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Tildelt: {assignedCount}/{students.length}</p>
          <StudentPageMapper
            mappings={mappings}
            onChange={(studentId, field, value) => {
              setMappings((prev) => prev.map((m) => (m.studentId === studentId ? { ...m, [field]: value } : m)))
            }}
          />
          <Button onClick={handleStartGrading} disabled={submitting || !!validationError || assignedCount !== students.length || !scanPath}>
            {submitting ? 'Starter…' : 'Start retting'}
          </Button>
          {validationError && <p className="text-sm text-destructive">{validationError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {status && <p className="text-sm text-green-600">{status}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
