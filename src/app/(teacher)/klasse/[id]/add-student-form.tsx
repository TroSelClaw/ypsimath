'use client'

import { useState } from 'react'
import { addStudentToClass } from '@/app/actions/classes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddStudentForm({ classId }: { classId: string }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)

    const result = await addStudentToClass(classId, email)

    if ('error' in result && result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Eleven ble lagt til!' })
      setEmail('')
    }

    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="elev@skole.no"
        required
        className="flex-1"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Legger til...' : 'Legg til'}
      </Button>
      {message && (
        <p className={`text-sm self-center ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}
