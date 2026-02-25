'use client'

import Link from 'next/link'

/**
 * Shown when storefront config API returns 404 (workspace/site not configured).
 * Prompts user to run init (which runs migrate, creates workspace/admin, optional seed + site config).
 */
export default function StorefrontSetupRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Storefront not configured
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Initialize the server first: from the server directory run
        </p>
        <pre className="mt-3 rounded bg-gray-600 p-3 text-left text-sm">
          python manage.py init
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          This runs migrate, creates a workspace and admin user (you will be prompted for password), and can import seed_data and site config (e.g. web/design/site-config-xmart.json). Then configure Site/theme in Admin if needed.
        </p>
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
