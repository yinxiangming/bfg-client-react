'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ProtectedPage } from '@/components/auth/ProtectedPage'
import { apiFetch, bfgApi } from '@/utils/api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

interface StaffRole {
  id: number
  name: string
  code: string
}

interface StaffMember {
  id: number
  user: User
  role: StaffRole
  is_active: boolean
  created_at: string
}

function RolePill({ role }: { role: StaffRole }) {
  const color =
    role.code === 'admin'
      ? 'bg-red-100 text-red-700 border-red-200'
      : role.code === 'manager'
      ? 'bg-orange-100 text-orange-700 border-orange-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
      {role.name}
    </span>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}
    />
  )
}

function Avatar({ user }: { user: User }) {
  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    user.email[0].toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

function InviteModal({
  roles,
  onClose,
  onInvited,
}: {
  roles: StaffRole[]
  onClose: () => void
  onInvited: (member: StaffMember) => void
}) {
  const t = useTranslations('admin.staff.invite')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<number>(roles[0]?.id ?? 0)
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSearching(true)
    setFoundUser(null)
    setNotFound(false)
    setError('')
    try {
      const data = await apiFetch<{ results: User[] }>(
        `${bfgApi.users()}?search=${encodeURIComponent(email)}`
      )
      const users = data.results ?? []
      const match = users.find((u) => u.email === email)
      if (match) {
        setFoundUser(match)
      } else {
        setNotFound(true)
      }
    } catch {
      setError(t('searchFailed'))
    } finally {
      setSearching(false)
    }
  }

  async function handleInvite() {
    if (!foundUser) return
    setSaving(true)
    setError('')
    try {
      const member = await apiFetch<StaffMember>(bfgApi.staffMembers(), {
        method: 'POST',
        body: JSON.stringify({ user_id: foundUser.id, role_id: selectedRole }),
      })
      onInvited(member)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'))
    } finally {
      setSaving(false)
    }
  }

  const displayName =
    foundUser
      ? `${foundUser.first_name} ${foundUser.last_name}`.trim() || foundUser.username
      : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFoundUser(null)
              setNotFound(false)
            }}
            placeholder={t('emailPlaceholder')}
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {searching ? t('searching') : t('search')}
          </button>
        </form>
        {notFound && (
          <p className="text-sm text-amber-600 mb-4">{t('notFound')}</p>
        )}
        {foundUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Avatar user={foundUser} />
              <div>
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{foundUser.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('assignRole')}</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!foundUser || saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const t = useTranslations('admin.staff.page')
  const locale = useLocale()
  const dateLocale = locale === 'zh-hans' ? 'zh-CN' : 'en-US'
  const [members, setMembers] = useState<StaffMember[]>([])
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membersData, rolesData] = await Promise.all([
        apiFetch<{ results: StaffMember[] }>(bfgApi.staffMembers()),
        apiFetch<{ results: StaffRole[] }>(bfgApi.staffRoles()),
      ])
      setMembers(membersData.results ?? (membersData as unknown as StaffMember[]))
      setRoles(rolesData.results ?? (rolesData as unknown as StaffRole[]))
    } catch {
      setError(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  async function handleRoleChange(member: StaffMember, roleId: number) {
    setUpdatingId(member.id)
    try {
      const updated = await apiFetch<StaffMember>(`${bfgApi.staffMembers()}${member.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role_id: roleId }),
      })
      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateFailed'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleToggleActive(member: StaffMember) {
    setUpdatingId(member.id)
    try {
      const updated = await apiFetch<StaffMember>(`${bfgApi.staffMembers()}${member.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !member.is_active }),
      })
      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateFailed'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(member: StaffMember) {
    const name =
      `${member.user.first_name} ${member.user.last_name}`.trim() || member.user.email
    if (!confirm(t('confirmRemove', { name }))) return
    setUpdatingId(member.id)
    try {
      await apiFetch(`${bfgApi.staffMembers()}${member.id}/`, { method: 'DELETE' })
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('removeFailed'))
    } finally {
      setUpdatingId(null)
    }
  }

  const activeCount = members.filter((m) => m.is_active).length

  return (
    <ProtectedPage requireAdmin>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('subtitle', { active: activeCount, total: members.length })}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/staff/roles"
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('rolesLink')}
            </a>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <span className="text-lg leading-none">+</span>
              {t('invite')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('loading')}</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('empty')}</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-medium text-gray-600">{t('table.member')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('table.role')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('table.status')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('table.joined')}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => {
                  const name =
                    `${member.user.first_name} ${member.user.last_name}`.trim() ||
                    member.user.username
                  const isUpdating = updatingId === member.id
                  const joinedDate = new Date(member.created_at).toLocaleDateString(dateLocale)
                  return (
                    <tr
                      key={member.id}
                      className={`border-t border-gray-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } ${isUpdating ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={member.user} />
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.role.id}
                          onChange={(e) => handleRoleChange(member, Number(e.target.value))}
                          disabled={isUpdating}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          title={member.is_active ? t('status.clickDeactivate') : t('status.clickActivate')}
                        >
                          <StatusDot active={member.is_active} />
                          {member.is_active ? t('status.active') : t('status.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{joinedDate}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          disabled={isUpdating}
                          className="text-sm text-red-400 hover:text-red-600 disabled:opacity-30"
                        >
                          {t('remove')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {showInvite && (
          <InviteModal
            roles={roles}
            onClose={() => setShowInvite(false)}
            onInvited={(member) => {
              setMembers((prev) => [member, ...prev])
              setShowInvite(false)
            }}
          />
        )}
      </div>
    </ProtectedPage>
  )
}
