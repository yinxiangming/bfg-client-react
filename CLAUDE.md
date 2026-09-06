# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # prepare + Next.js dev server (Turbopack by default)
npm run build      # prepare + production build
npm run lint       # ESLint via Next.js
npm run prepare    # regenerate plugin loaders, routes, and theme registry (run before build/dev)
```

No test runner is configured in this package. Tests live in the Django server (`src/server/`).

## Architecture

### App Sections

Three route groups under `src/app/`:
- `(storefront)/` — public-facing shop
- `admin/` — back-office panel
- `account/` — customer account pages
- `auth/` — login/register/password flows

### Source Layout (`src/`)

| Dir | Purpose |
|-----|---------|
| `app/` | Next.js App Router pages |
| `views/` | Page-level components (`admin/`, `storefront/`, `account/`, `common/`) |
| `components/` | Shared UI components |
| `services/` | API client functions (one file per BFG2 module: `store.ts`, `web.ts`, `finance.ts`, etc.) |
| `hooks/` | React hooks |
| `contexts/` | React context providers |
| `configs/` | Nav and layout config (`layoutConfig.ts`, `accountLayoutConfig.ts`, `themeConfig.ts`) |
| `types/` | TypeScript types — notably `types/schema.ts` for schema-driven UI |
| `utils/` | Utilities; `utils/api.ts` exports `apiFetch`, `bfgApi`, `buildApiUrl` |
| `extensions/` | Extension/plugin system core |
| `plugins/` | Active plugins (`channels/`, `outreach/`) + `loaders.generated.ts` |
| `i18n/` | `next-intl` config and locale request handler |
| `messages/` | Translation JSON files (English, Simplified Chinese) |

### Schema-Driven UI

`SchemaTable` and `SchemaForm` in `src/components/schema/` are generic components driven by `ListSchema` / `FormSchema` types (`src/types/schema.ts`). Most admin CRUD pages use these instead of hand-coded forms/tables.

- `FormSchema.blocks[]` — grouped fields (preferred over deprecated `fields[]`)
- `FormField.optionsSource` — `'static' | 'api' | 'cache'` controls how select options load
- `SchemaTable` actions can be `scope: 'global'` or `scope: 'row'`

### API Layer

All API calls go through `src/utils/api.ts`:
- `apiFetch(path, options)` — authenticated fetch with token refresh
- `bfgApi` — pre-built endpoint helpers for BFG2 modules
- `buildApiUrl(path, version?, module?)` — constructs full URLs

Server-side SSR uses `API_URL` env var (internal Docker URL); browser uses `NEXT_PUBLIC_API_URL`.

### Plugin / Extension System

`npm run prepare` (`scripts/prepare.js`) auto-generates five things:
1. `src/plugins/loaders.generated.ts` — lazy loaders for all plugins
2. Plugin routes: copies `plugins/<id>/app/` into `src/app/` under `plugins/<id>/`
3. `src/components/storefront/themes/registry.generated.ts` — storefront theme registry (incl. page overrides)
4. `src/components/account/themes/registry.generated.ts` — account skin registry
5. `src/components/auth/themes/registry.generated.ts` — auth skin registry

URL rewrites in `next.config.ts` map `/admin/<pluginId>/...` → `/admin/plugins/<pluginId>/...`.

Each plugin exports an `Extension` object (`src/extensions/registry.ts`) with:
- `adminNav` — nav items to inject (before/after/replace/hide by `targetId`)
- `sections` — page slot components (use `targetSlot`; `targetSection` is deprecated)
- `dataHooks` — `onLoad`/`onSave` interceptors keyed by page path

In pages: `usePageSlots(page)` + `renderSlot(slotId, visibleSlots, replacements, Component, props)`.
Enable plugins via `ENABLED_PLUGINS=plugin1,plugin2` in `.env.local`.

### Skin System (Storefront / Account / Auth)

A unified "skin" lets a workspace swap the layout shell and individual page bodies for the storefront, account, and auth route groups. Skin selection is keyed off the storefront `config.theme` value returned by `/api/v1/settings/storefront/`, so picking a storefront theme in admin auto-applies the matching skin across all three areas. Skins with no matching folder fall back to baseline behavior — there is **no** "default" skin folder.

**Folder convention** (per area):

```
src/components/<area>/themes/<skin-id>/
├── Layout.tsx          # account/auth: optional shell wrapping all routes
│                       # storefront: see below — Layout/Header/Footer kept legacy
├── theme.json          # optional metadata (id/name/description/version)
└── pages/              # optional per-route overrides; key = relative path sans .tsx
    ├── <key>.tsx       # /<area>/<key>
    ├── <key>/<sub>.tsx # /<area>/<key>/<sub>
    └── ...
```

Where `<area>` is `account`, `auth`, or `storefront`.

**Storefront** is special: the existing `THEME_REGISTRY` (`{ Layout, Header, Footer }` per skin) and `HOME_REGISTRY` (`Home.tsx`) stay untouched for backwards compatibility. Page-level overrides live alongside them in a new `STOREFRONT_PAGE_OVERRIDES` export. So a storefront skin = `Layout.tsx` + `Header.tsx` + `Footer.tsx` + optional `Home.tsx` + optional `pages/<key>.tsx`.

**Stable route keys**:

| Area | Route key | URL |
|------|-----------|-----|
| storefront | `home` | `/` |
| storefront | `cart` | `/cart` |
| storefront | `checkout` | `/checkout` |
| storefront | `checkout/success` | `/checkout/success` |
| storefront | `search` | `/search` |
| storefront | `product/[id]` | `/product/[id]` |
| storefront | `category/[slug]` | `/category/[slug]` |
| storefront | `cms` | `/[slug]` |
| account | `dashboard` | `/account/` |
| account | `orders`, `orders/[id]` | `/account/orders[/:id]` |
| account | `addresses`, `payments`, `settings`, `support`, `alerts`, `comments`, `credit-slips`, `change-password`, `gdpr`, `information` | `/account/<key>` |
| account | `wallet/withdraw` | `/account/wallet/withdraw` |
| auth | `login`, `register`, `forgot-password`, `reset-password`, `verify-email` | `/auth/<key>` |

**Resolvers** (server-only):

- `resolveAccountSkin()` / `resolveAccountPage(routeKey)` in `src/components/account/themes/resolve.ts`
- `resolveAuthSkin()` / `resolveAuthPage(routeKey)` in `src/components/auth/themes/resolve.ts`
- `resolveStorefrontPage(routeKey)` in `src/components/storefront/themes/resolve.ts`

**Resolution order** (account/auth):
1. URL `?skin=<id>` / cookie preview — *not yet implemented; reserved for Phase 2*
2. Storefront config `theme` field
3. Returns `null` → caller renders baseline (current MUI account, free-form auth)

**Resolution order** (storefront home page only — has extra layers):
1. Plugin root-slot replacement (`getPageSlotReplacements`)
2. Skin `pages/home.tsx` override
3. Legacy `HOME_REGISTRY[theme]` (i.e. `themes/<id>/Home.tsx`)
4. CMS dynamic page (when `pageData.blocks` non-empty)
5. Default `HomePage` view

**Page-host pattern**: each `app/<area>/<route>/page.tsx` is a thin async server-component shell:

```tsx
import { resolveAccountPage } from '@/components/account/themes/resolve'
import OrdersDefault from './OrdersDefault'

export default async function Page() {
  const Override = await resolveAccountPage('orders')
  const Component = Override ?? OrdersDefault
  return <Component />
}
```

The current page body (often a `'use client'` component using MUI) lives in a sibling file like `OrdersDefault.tsx`. Adding a skin override = drop a file into `themes/<id>/pages/orders.tsx`, run `npm run prepare`.

**Layout-level swap**:
- `app/account/layout.tsx` calls `resolveAccountSkin()` → uses `skin.Layout` if present, else current MUI `AccountLayoutClient`
- `app/auth/layout.tsx` calls `resolveAuthSkin()` → wraps children in `skin.Layout` if present, else bare `StorefrontConfigProvider`
- Storefront layout still uses `ThemeShell` + `THEME_REGISTRY` (unchanged)

**Built-in skins**:
- Storefront: `store`, `website` (existing — Layout/Header/Footer/Home, no `pages/` overrides)
- Account: `website` (new non-MUI skin — `Layout.tsx` + `pages/dashboard.tsx`, uses `.wa-*` CSS classes in `website-account.css`)
- Auth: `website` (new non-MUI skin — `Layout.tsx` + `pages/{login,register}.tsx`, uses `.au-*` CSS classes in `website-auth.css`)

Skins are activated together: setting `Site.theme.code = 'website'` swaps storefront, account, and auth all at once. `theme.code = 'store'` keeps the legacy MUI account experience and the bare auth pages.

**Authoring a new skin**:

1. Pick a skin id (e.g. `brand-acme`). Adding to storefront also requires a backend `Theme` row with `code = brand-acme`.
2. Create `src/components/storefront/themes/brand-acme/{Layout,Header,Footer,Home}.tsx` for the storefront (legacy three-piece) — and/or drop `pages/<key>.tsx` for page-level overrides.
3. Optionally create `src/components/account/themes/brand-acme/Layout.tsx` and `pages/<key>.tsx` for the account area.
4. Optionally create `src/components/auth/themes/brand-acme/Layout.tsx` and `pages/<key>.tsx` for the auth area.
5. `npm run prepare` regenerates all three `registry.generated.ts` files.
6. In admin, set the active site's theme to `brand-acme`.

### Storefront Themes (legacy contract, still in use)

Themes live in `src/components/storefront/themes/<theme-id>/`. The legacy three-piece contract (`Layout.tsx`, `Header.tsx`, `Footer.tsx`, optional `Home.tsx`) is preserved — `THEME_REGISTRY` and `HOME_REGISTRY` continue to drive `ThemeShell` and the home page. Built-in themes: `store`, `website`. New page-level overrides go under `pages/` (see Skin System above).

## Extension Symlinks & Module Resolution

Extensions (e.g. `extensions/channels-client/`) are symlinked into `src/plugins/<name>/` from outside the client directory. Turbopack resolves symlinks to their real paths and then looks for `node_modules` relative to the real path — which is outside `src/client/`, causing failures.

**Fix**: Each extension directory must have a `node_modules` symlink pointing to the client's `node_modules`:

```bash
ln -s ../../src/client/node_modules extensions/<name>-client/node_modules
```

These symlinks are gitignored via `extensions/*/node_modules` in the root `.gitignore`.

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL, no trailing slash |
| `NEXT_PUBLIC_WORKSPACE_ID` | No | Bind to a specific workspace; omit for platform instances |
| `NEXT_PUBLIC_PLATFORM_LOGIN_URL` | No | When set, `/auth/login` redirects here |
| `ENABLED_PLUGINS` / `NEXT_PUBLIC_ENABLED_PLUGINS` | No | Comma-separated plugin IDs (default: all) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Address autocomplete |
| `NEXT_PUBLIC_MEDIA_URL` | No | Defaults to `NEXT_PUBLIC_API_URL/media` |
| `API_URL` | No | Server-side only (Docker internal); falls back to `NEXT_PUBLIC_API_URL` |
| `NEXT_FILE_TRACING_ROOT` | No | Set to `/app` in Docker; auto-detected otherwise |

## Operational notes / common "how do I lock this down" checks

These are config-driven (no code changes) and surface via
`GET /api/v1/settings/storefront/`. After changing any backing value, clear the
server's storefront-config cache (restart, or call the workspace cache
invalidator) so the next SSR fetch sees it.

### Force a single color mode (light-only)

Color mode is driven by `allowed_color_modes` on the storefront config
(`Settings.custom_settings.storefront_ui.allowed_color_modes`, default
`['light','dark']`). When exactly **one** mode is allowed:

- `app/layout.tsx` computes `lockedMode` via `getAllowedColorModes()` and pins
  `initialMode` + `defaultSystemMode` (no first-paint flash).
- `StorefrontConfigContext` calls `forceMode(allowed[0])`, overriding any value
  stored in `localStorage['theme-mode']` and the OS `prefers-color-scheme`.
- `ThemeSwitcher` / storefront header hide the light/dark toggle
  (`getAllowedColorModes(config).length > 1` gate).

So: set `allowed_color_modes: ['light']` (and optionally `default_color_mode:
'light'`) to lock light-only. Note `ThemeContext` alone does **not** enforce
this — the lock comes from the storefront config flowing through the two points
above, which wrap storefront/account/auth. Areas not wrapped by
`StorefrontConfigProvider` (e.g. the MUI `/admin` shell) rely on the SSR
`lockedMode`/`defaultMode` only.

### Force a single language (English-only)

Languages come from the storefront config `languages` / `default_language`,
resolved server-side preferring the `bfg.web.Site` (`Site.languages`,
`Site.default_language`), then `Settings.supported_languages` /
`Settings.default_language`. Set `languages` to a single entry (e.g. `['en']`)
to hide the language switcher (the client treats `len(languages) === 1` as
locked) and pin `<html lang>`.

### "Admin user can't open /admin" (bounced to /account)

`/admin` is gated by `AdminAccessGuard`, which uses `useIsStaff()` →
`StaffMemberContext` → `GET /api/v1/me/` `staff_member.is_active`. It checks the
workspace **`StaffMember`**, NOT Django `is_staff`/`is_superuser`. A superuser
with no active `StaffMember` in the current workspace is redirected to
`/account`. Fix at the data layer (no client change): provision the workspace's
roles (`manage.py init_system_roles`) and create an active `StaffMember` with the
`admin` role for that user. Diagnose by inspecting `staff_member` in
`GET /api/v1/me/` for the logged-in admin.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
