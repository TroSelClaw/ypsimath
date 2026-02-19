import {
  deleteUser,
  importUsersFromCsv,
  setUserDeactivated,
  updateUserRole,
} from '@/app/actions/admin-users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 50

type SearchParams = {
  page?: string
  q?: string
}

type ProfileRow = {
  id: string
  email: string
  display_name: string
  role: 'student' | 'teacher' | 'admin'
  deactivated_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('nb-NO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function getLastLoginMap() {
  const admin = createAdminClient()
  const map = new Map<string, string | null>()

  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) {
      break
    }

    for (const user of data.users) {
      map.set(user.id, user.last_sign_in_at ?? null)
    }

    if (data.users.length < 200) break
    page += 1
  }

  return map
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1'))
  const query = (params.q ?? '').trim().toLowerCase()

  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, deactivated_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const allProfiles = (profiles ?? []) as ProfileRow[]

  const filtered = query
    ? allProfiles.filter(
        (profile) =>
          profile.email.toLowerCase().includes(query) ||
          profile.display_name.toLowerCase().includes(query),
      )
    : allProfiles

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const paged = filtered.slice(start, start + PAGE_SIZE)

  const lastLoginByUserId = await getLastLoginMap()

  const userIds = paged.map((row) => row.id)
  const classNameByStudent = new Map<string, string[]>()

  if (userIds.length > 0) {
    const { data: memberships } = await supabase
      .from('class_memberships')
      .select('student_id, classes(name)')
      .in('student_id', userIds)

    for (const row of memberships ?? []) {
      const studentId = row.student_id as string
      const className = (row.classes as { name?: string } | null)?.name
      if (!className) continue
      const existing = classNameByStudent.get(studentId) ?? []
      existing.push(className)
      classNameByStudent.set(studentId, existing)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Brukeradministrasjon</h1>
        <p className="text-sm text-muted-foreground">
          Endre roller, deaktiver/slett kontoer, og importer elever via CSV.
        </p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="text-sm font-medium">Importer elever (CSV)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Format: header med kolonnene name,email.</p>
        <form
          action={async (formData) => {
            'use server'
            await importUsersFromCsv(formData)
          }}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <Input name="csv" type="file" accept=".csv,text/csv" required className="max-w-sm" />
          <Button type="submit" size="sm">
            Importer og send invitasjoner
          </Button>
        </form>
      </section>

      <form className="flex flex-wrap items-center gap-2 rounded-xl border p-4" method="GET">
        <Input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Søk på navn eller e-post"
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary" size="sm">
          Søk
        </Button>
      </form>

      <section className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Navn</th>
                <th className="px-4 py-3 font-medium">E-post</th>
                <th className="px-4 py-3 font-medium">Rolle</th>
                <th className="px-4 py-3 font-medium">Sist innlogget</th>
                <th className="px-4 py-3 font-medium">Klasser</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((profile) => {
                const classNames = classNameByStudent.get(profile.id) ?? []

                return (
                  <tr key={profile.id} className="border-b align-top last:border-b-0">
                    <td className="px-4 py-3 font-medium">{profile.display_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                    <td className="px-4 py-3">
                      <form
                        action={async (formData) => {
                          'use server'
                          await updateUserRole(formData)
                        }}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={profile.id} />
                        <select
                          name="role"
                          defaultValue={profile.role}
                          className="rounded-md border bg-background px-2 py-1 text-xs"
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>
                        <Button type="submit" variant="outline" size="sm">
                          Lagre
                        </Button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lastLoginByUserId.get(profile.id) ?? null)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {classNames.length > 0 ? classNames.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {profile.deactivated_at ? (
                        <Badge variant="secondary">Deaktivert</Badge>
                      ) : (
                        <Badge variant="default">Aktiv</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <form
                          action={async (formData) => {
                            'use server'
                            await setUserDeactivated(formData)
                          }}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="userId" value={profile.id} />
                          <input
                            type="hidden"
                            name="deactivate"
                            value={profile.deactivated_at ? 'false' : 'true'}
                          />
                          <Button type="submit" variant="outline" size="sm">
                            {profile.deactivated_at ? 'Reaktiver' : 'Deaktiver'}
                          </Button>
                        </form>

                        <form
                          action={async (formData) => {
                            'use server'
                            await deleteUser(formData)
                          }}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="userId" value={profile.id} />
                          <input type="hidden" name="email" value={profile.email} />
                          <Input
                            name="confirmation"
                            placeholder="Skriv e-post for sletting"
                            className="h-8 w-44 text-xs"
                          />
                          <Button type="submit" variant="destructive" size="sm">
                            Slett
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Ingen brukere funnet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Side {currentPage} av {totalPages} · {filtered.length} brukere
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
            <a href={`/admin/brukere?page=${Math.max(1, currentPage - 1)}&q=${encodeURIComponent(params.q ?? '')}`}>
              Forrige
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
            <a
              href={`/admin/brukere?page=${Math.min(totalPages, currentPage + 1)}&q=${encodeURIComponent(params.q ?? '')}`}
            >
              Neste
            </a>
          </Button>
        </div>
      </footer>
    </div>
  )
}
