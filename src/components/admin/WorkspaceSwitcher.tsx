'use client'

import { useEffect, useRef, useState } from 'react'
import { getMyWorkspaces, type WorkspaceMembership } from '@/services/platform'
import { getWorkspaceIdFromJwt } from '@/utils/api'
import { switchWorkspace } from '@/utils/switchWorkspace'
import Icon from '@components/Icon'

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentId(getWorkspaceIdFromJwt())
    getMyWorkspaces().then(setWorkspaces).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const current = workspaces.find(w => w.workspace_id === currentId)

  const handleSwitch = async (ws: WorkspaceMembership) => {
    if (ws.workspace_id === currentId || switching) return
    setSwitching(true)
    setOpen(false)
    try {
      await switchWorkspace(ws.workspace_id)
      window.location.reload()
    } catch {
      setSwitching(false)
    }
  }

  if (workspaces.length <= 1) return null

  return (
    <div className='workspace-switcher' ref={ref}>
      <button
        type='button'
        className='admin-topbar-btn workspace-switcher-trigger'
        onClick={() => setOpen(o => !o)}
        disabled={switching}
        aria-haspopup='listbox'
        aria-expanded={open}
        title={current?.workspace_name ?? 'Switch workspace'}
      >
        <Icon icon='tabler-building' />
        <span className='workspace-switcher-name'>{current?.workspace_name ?? '—'}</span>
        <Icon icon={open ? 'tabler-chevron-up' : 'tabler-chevron-down'} />
      </button>

      {open && (
        <ul className='workspace-switcher-dropdown' role='listbox'>
          {workspaces.map(ws => (
            <li
              key={ws.workspace_id}
              role='option'
              aria-selected={ws.workspace_id === currentId}
              className={`workspace-switcher-option ${ws.workspace_id === currentId ? 'active' : ''}`}
              onClick={() => handleSwitch(ws)}
            >
              <span>{ws.workspace_name}</span>
              {ws.workspace_id === currentId && <Icon icon='tabler-check' />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
