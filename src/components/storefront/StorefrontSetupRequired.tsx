'use client'

import Link from 'next/link'

/**
 * Shown when storefront config API returns 404 (workspace/site not configured).
 * Prompts user to run migrations and configure the backend.
 */
export default function StorefrontSetupRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Storefront not configured
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Please complete database and site configuration on the server first.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>Run migrations: <code className="rounded bg-gray-100 px-1">python manage.py migrate</code></li>
          <li>Create workspace / init web: run the server init commands if needed</li>
          <li>Configure general settings in Admin (e.g. Site name, theme)</li>
        </ul>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Go to Admin
        </Link>
      </div>
    </div>
  )
}
