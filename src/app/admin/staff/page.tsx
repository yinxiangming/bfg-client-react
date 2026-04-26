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

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

interface Invitation {
  id: number
  uuid: string
  email: string
  role: StaffRole
  status: InvitationStatus
  invited_by: User | null
  accepted_by: User | null
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
  message: string
  created_at: string
}

const EXPIRY_OPTIONS = [24, 48, 72, 168, 336]
const DEFAULT_EXPIRY_HOURS = 48

function RolePill({ role }: { role: StaffRole }) {
  const color =
    role.code === 'admin'
      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
      : role.code === 'manager'
      ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30'
      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
      {role.name}
    </span>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
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

function InvitationStatusPill({ status }: { status: InvitationStatus }) {
  const t = useTranslations('admin.staff.invitations.status')
  const styles: Record<InvitationStatus, string> = {
    pending:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    accepted:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
    expired:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10',
    revoked:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${styles[status]}`}>
      {t(status)}
    </span>
  )
}

function InviteModal({
  roles,
  onClose,
  onInvited,
}: {
  roles: StaffRole[]
  onClose: () => void
  onInvited: (invitation: Invitation) => void
}) {
  const t = useTranslations('admin.staff.invite')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<number>(roles[0]?.id ?? 0)
  const [expiryHours, setExpiryHours] = useState<number>(DEFAULT_EXPIRY_HOURS)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !selectedRole) return
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch<{ created: Invitation[]; errors: { email: string; error: unknown }[] }>(
        bfgApi.staffInvitations(),
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            role_id: selectedRole,
            expiry_hours: expiryHours,
            message: message.trim() || undefined,
          }),
        }
      )
      if (res.created?.length) {
        onInvited(res.created[0])
        return
      }
      const firstErr = res.errors?.[0]?.error
      const msg =
        typeof firstErr === 'string'
          ? firstErr
          : firstErr && typeof firstErr === 'object'
          ? Object.values(firstErr as Record<string, unknown>)[0]?.toString() ?? t('failed')
          : t('failed')
      setError(msg)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#312D4B] rounded-xl shadow-xl w-full max-w-md p-6 border border-transparent dark:border-white/10"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('title')}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('hint')}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('assignRole')}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-white dark:bg-[#312D4B] text-gray-900 dark:text-gray-100">
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('expiryLabel')}
            </label>
            <select
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXPIRY_OPTIONS.map((h) => (
                <option key={h} value={h} className="bg-white dark:bg-[#312D4B] text-gray-900 dark:text-gray-100">
                  {t('expiryHours', { hours: h })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('messageLabel')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={3}
              maxLength={2000}
              className="w-full border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !email.trim() || !selectedRole}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}

function InvitationsTable({
  invitations,
  loading,
  onResend,
  onRevoke,
  busyId,
  dateLocale,
}: {
  invitations: Invitation[]
  loading: boolean
  onResend: (invite: Invitation) => void
  onRevoke: (invite: Invitation) => void
  busyId: string | null
  dateLocale: string
}) {
  const t = useTranslations('admin.staff.invitations')

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500">
        {useTranslations('admin.staff.page')('loading')}
      </div>
    )
  }
  if (invitations.length === 0) {
    return <div className="text-center py-10 text-gray-400 dark:text-gray-500">{t('empty')}</div>
  }

  return (
    <div className="bg-white dark:bg-[#312D4B] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
            <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.email')}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.role')}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.status')}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.expires')}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.invitedBy')}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv, idx) => {
            const expiry = new Date(inv.expires_at)
            const expiryStr = expiry.toLocaleString(dateLocale)
            const inviter = inv.invited_by
              ? `${inv.invited_by.first_name} ${inv.invited_by.last_name}`.trim() ||
                inv.invited_by.email
              : t('neverInvited')
            const isBusy = busyId === inv.uuid
            const canResend = inv.status === 'pending' || inv.status === 'expired'
            const canRevoke = inv.status === 'pending' || inv.status === 'expired'
            return (
              <tr
                key={inv.uuid}
                className={`border-t border-gray-100 dark:border-white/10 ${
                  idx % 2 === 0
                    ? 'bg-white dark:bg-transparent'
                    : 'bg-gray-50/50 dark:bg-white/[0.03]'
                } ${isBusy ? 'opacity-50' : ''}`}
              >
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{inv.email}</td>
                <td className="px-4 py-3"><RolePill role={inv.role} /></td>
                <td className="px-4 py-3"><InvitationStatusPill status={inv.status} /></td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{expiryStr}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inviter}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {canResend && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onResend(inv)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30"
                    >
                      {t('resend')}
                    </button>
                  )}
                  {canRevoke && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onRevoke(inv)}
                      className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30"
                    >
                      {t('revoke')}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function StaffPage() {
  const t = useTranslations('admin.staff.page')
  const tInvites = useTranslations('admin.staff.invitations')
  const locale = useLocale()
  const dateLocale = locale === 'zh-hans' ? 'zh-CN' : 'en-US'
  const [members, setMembers] = useState<StaffMember[]>([])
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'members' | 'invitations'>('members')

  const loadInvitations = useCallback(async () => {
    setInvitesLoading(true)
    try {
      const data = await apiFetch<{ results: Invitation[] } | Invitation[]>(bfgApi.staffInvitations())
      const list = Array.isArray(data) ? data : data.results ?? []
      setInvitations(list)
    } catch (err) {
      const detail = err instanceof Error ? err.message : ''
      setError(detail ? `${tInvites('loadFailed')}: ${detail}` : tInvites('loadFailed'))
    } finally {
      setInvitesLoading(false)
    }
  }, [tInvites])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membersData, rolesData] = await Promise.all([
        apiFetch<{ results: StaffMember[] }>(bfgApi.staffMembers()),
        apiFetch<{ results: StaffRole[] }>(bfgApi.staffRoles()),
      ])
      setMembers(membersData.results ?? (membersData as unknown as StaffMember[]))
      setRoles(rolesData.results ?? (rolesData as unknown as StaffRole[]))
    } catch (err) {
      const detail = err instanceof Error ? err.message : ''
      setError(detail ? `${t('loadFailed')}: ${detail}` : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
    loadInvitations()
  }, [load, loadInvitations])

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

  async function handleResendInvitation(invite: Invitation) {
    setBusyInvitationId(invite.uuid)
    try {
      const updated = await apiFetch<Invitation>(
        `${bfgApi.staffInvitations()}${invite.uuid}/resend/`,
        { method: 'POST' }
      )
      setInvitations((prev) => prev.map((i) => (i.uuid === invite.uuid ? updated : i)))
    } catch (err) {
      setError(err instanceof Error ? err.message : tInvites('resendFailed'))
    } finally {
      setBusyInvitationId(null)
    }
  }

  async function handleRevokeInvitation(invite: Invitation) {
    if (!confirm(tInvites('confirmRevoke', { email: invite.email }))) return
    setBusyInvitationId(invite.uuid)
    try {
      await apiFetch(`${bfgApi.staffInvitations()}${invite.uuid}/`, { method: 'DELETE' })
      setInvitations((prev) =>
        prev.map((i) =>
          i.uuid === invite.uuid
            ? { ...i, status: 'revoked', revoked_at: new Date().toISOString() }
            : i
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : tInvites('revokeFailed'))
    } finally {
      setBusyInvitationId(null)
    }
  }

  const activeCount = members.filter((m) => m.is_active).length
  const pendingCount = invitations.filter((i) => i.status === 'pending').length

  return (
    <ProtectedPage requireAdmin>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('subtitle', { active: activeCount, total: members.length })}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/staff/roles"
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-white/15 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
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
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm rounded-lg flex justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setTab('members')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === 'members'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t('title')}
          </button>
          <button
            type="button"
            onClick={() => setTab('invitations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
              tab === 'invitations'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tInvites('title')}
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'members' ? (
          loading ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('loading')}</div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t('empty')}</div>
          ) : (
            <div className="bg-white dark:bg-[#312D4B] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.member')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.role')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.status')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('table.joined')}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">{t('table.actions')}</th>
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
                        className={`border-t border-gray-100 dark:border-white/10 ${
                          idx % 2 === 0
                            ? 'bg-white dark:bg-transparent'
                            : 'bg-gray-50/50 dark:bg-white/[0.03]'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={member.user} />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{member.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={member.role.id}
                            onChange={(e) => handleRoleChange(member, Number(e.target.value))}
                            disabled={isUpdating}
                            className="border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id} className="bg-white dark:bg-[#312D4B] text-gray-900 dark:text-gray-100">
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
                            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                            title={member.is_active ? t('status.clickDeactivate') : t('status.clickActivate')}
                          >
                            <StatusDot active={member.is_active} />
                            {member.is_active ? t('status.active') : t('status.inactive')}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{joinedDate}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(member)}
                            disabled={isUpdating}
                            className="text-sm text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30"
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
          )
        ) : (
          <InvitationsTable
            invitations={invitations}
            loading={invitesLoading}
            onResend={handleResendInvitation}
            onRevoke={handleRevokeInvitation}
            busyId={busyInvitationId}
            dateLocale={dateLocale}
          />
        )}

        {showInvite && (
          <InviteModal
            roles={roles}
            onClose={() => setShowInvite(false)}
            onInvited={(invitation) => {
              setInvitations((prev) => [invitation, ...prev])
              setShowInvite(false)
              setTab('invitations')
            }}
          />
        )}
      </div>
    </ProtectedPage>
  )
}
