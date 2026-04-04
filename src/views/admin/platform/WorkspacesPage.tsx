/**
 * Workspace List — /admin/platform/workspaces
 */
import WorkspaceTable from '@/components/platform/WorkspaceTable'
import Link from 'next/link'

export default function WorkspacesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Link
          href="/admin/platform/workspaces/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + New Workspace
        </Link>
      </div>
      <WorkspaceTable />
    </div>
  )
}
