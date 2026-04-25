'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ProtectedPage } from '@/components/auth/ProtectedPage'
import { RolePermissionMatrix } from '@/components/admin/RolePermissionMatrix'
import { apiFetch, bfgApi } from '@/utils/api'

interface StaffRole {
  id: number
  name: string
  code: string
  description: string
  permissions: Record<string, string[] | boolean>
  is_system: boolean
  is_active: boolean
  created_at: string
}

function RoleBadge({ role }: { role: StaffRole }) {
  const color =
    role.code === 'admin'
      ? 'bg-red-100 text-red-700'
      : role.code === 'manager'
      ? 'bg-orange-100 text-orange-700'
      : role.is_system
      ? 'bg-gray-100 text-gray-600'
      : 'bg-blue-100 text-blue-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium ${color}`}>
      {role.code}
    </span>
  )
}

function CreateRoleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (role: StaffRole) => void
}) {
  const t = useTranslations('admin.staff.roles.create')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const role = await apiFetch<StaffRole>(bfgApi.staffRoles(), {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      })
      onCreated(role)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('namePlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RolesPage() {
  const t = useTranslations('admin.staff.roles.page')
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<
    Record<number, Record<string, string[] | boolean>>
  >({})
  const [saving, setSaving] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ results: StaffRole[] }>(bfgApi.staffRoles())
      setRoles(data.results ?? (data as unknown as StaffRole[]))
    } catch {
      setError(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function handleSavePermissions(role: StaffRole) {
    const permissions = editingPermissions[role.id] ?? role.permissions
    setSaving(role.id)
    try {
      const updated = await apiFetch<StaffRole>(`${bfgApi.staffRoles()}${role.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      })
      setRoles((prev) => prev.map((r) => (r.id === role.id ? updated : r)))
      setEditingPermissions((prev) => {
        const next = { ...prev }
        delete next[role.id]
        return next
      })
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(role: StaffRole) {
    if (!confirm(t('confirmDelete', { name: role.name }))) return
    setDeleting(role.id)
    try {
      await apiFetch(`${bfgApi.staffRoles()}${role.id}/`, { method: 'DELETE' })
      setRoles((prev) => prev.filter((r) => r.id !== role.id))
      if (expandedId === role.id) setExpandedId(null)
    } catch {
      setError(t('deleteFailed'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <ProtectedPage requireAdmin>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            {t('create')}
          </button>
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
        ) : (
          <div className="space-y-3">
            {roles.map((role) => {
              const isExpanded = expandedId === role.id
              const pendingPermissions = editingPermissions[role.id]
              const isDirty = pendingPermissions !== undefined

              return (
                <div
                  key={role.id}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(role.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{role.name}</span>
                      <RoleBadge role={role} />
                      {role.is_system && (
                        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                          {t('system')}
                        </span>
                      )}
                      {isDirty && (
                        <span className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded px-1.5 py-0.5">
                          {t('unsaved')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {role.description && (
                        <span className="text-sm text-gray-400 hidden sm:block">
                          {role.description}
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 px-5 py-4">
                      <RolePermissionMatrix
                        permissions={pendingPermissions ?? role.permissions}
                        readOnly={role.is_system}
                        onChange={(newPerms) =>
                          setEditingPermissions((prev) => ({ ...prev, [role.id]: newPerms }))
                        }
                      />
                      <div className="flex justify-between items-center mt-4">
                        <div>
                          {!role.is_system && (
                            <button
                              type="button"
                              onClick={() => handleDelete(role)}
                              disabled={deleting === role.id}
                              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              {deleting === role.id ? t('deleting') : t('deleteRole')}
                            </button>
                          )}
                        </div>
                        {!role.is_system && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPermissions((prev) => {
                                  const next = { ...prev }
                                  delete next[role.id]
                                  return next
                                })
                              }}
                              disabled={!isDirty}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
                            >
                              {t('discard')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePermissions(role)}
                              disabled={!isDirty || saving === role.id}
                              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {saving === role.id ? t('saving') : t('save')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {showCreate && (
          <CreateRoleModal
            onClose={() => setShowCreate(false)}
            onCreated={(role) => {
              setRoles((prev) => [...prev, role])
              setShowCreate(false)
              setExpandedId(role.id)
            }}
          />
        )}
      </div>
    </ProtectedPage>
  )
}
