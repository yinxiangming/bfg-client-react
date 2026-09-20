# BFG Framework — Client (Next.js)

Admin UI and storefront for the BFG open-source e-commerce and SaaS framework. Built with Next.js 14 (App Router), MUI v5, and next-intl.

Requires the BFG Django backend running. See [../server/README.md](../server/README.md).

## Features

- **Admin panel** — workspace settings, products, orders, customers, delivery, finance, marketing, support
- **Storefront** — product listing, cart, checkout, account pages
- **Multi-workspace** — JWT + workspace token exchange; URL-based or header-based tenant routing
- **Platform extension** — optional Platform admin UI (embedded or standalone mode)
- **i18n** — next-intl; English + Simplified Chinese out of the box
- **Plugin system** — per-workspace UI extensions auto-loaded from `src/plugins/`
- **Extension registry** — composable terminology, config, and hook overrides via `src/extensions/`
- **Builtin storefront skins** — `atelier-grid` and `project-grid` are brand-neutral light-only skins discovered from `src/components/storefront/themes/`

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn)
- BFG Django backend running at `http://localhost:8000`

### Setup

```bash
cd src/client
npm install
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Auto-generate plugin/extension loaders, then start Next.js dev server |
| `npm run build` | Auto-generate loaders, then build for production |
| `npm run start` | Start production server (run after `build`) |
| `npm run lint` | ESLint |

> `npm run dev` and `npm run build` both run `scripts/prepare.js` first to auto-discover plugins and regenerate `src/plugins/loaders.generated.ts`. You don't need to run this manually.

The same prepare step discovers builtin storefront skins and regenerates
`src/components/storefront/themes/registry.generated.ts`. A skin directory must
provide `Layout.tsx`, `Header.tsx`, and `Footer.tsx`; add `Home.tsx` and
`theme.json` when it supplies a home layout and display metadata.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | BFG API base URL. No trailing slash. e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_WORKSPACE_API_URL` | — | Workspace server URL (standalone Platform mode only). Falls back to `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_WORKSPACE_ID` | — | Pin to a specific workspace ID. Leave unset for dynamic token-exchange-based routing |
| `NEXT_PUBLIC_PLATFORM_LOGIN_URL` | — | If set, `/auth/login` redirects here (for workspaces managed by a Platform instance) |
| `NEXT_PUBLIC_ENABLED_PLUGINS` | — | Comma-separated plugin IDs to activate. Default: all plugins under `src/plugins/` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — | Google Maps API key for address autocomplete |
| `NEXT_PUBLIC_MEDIA_URL` | — | Media CDN base. Default: `NEXT_PUBLIC_API_URL/media` |
| `ALLOWED_DEV_ORIGINS` | — | Extra allowed origins for `next dev` (comma-separated) |
| `NEXT_FILE_TRACING_ROOT` | — | File tracing root for Docker deployments |

See `.env.example` for full documentation with examples.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (storefront)/       # Public storefront (product listing, cart, checkout)
│   │   ├── page.tsx        # Home / product listing
│   │   ├── product/        # Product detail
│   │   ├── category/
│   │   ├── cart/
│   │   └── checkout/
│   ├── admin/              # Admin panel (workspace management)
│   │   ├── dashboard/
│   │   ├── store/          # Products, categories, orders, etc.
│   │   ├── settings/
│   │   └── [slug]/         # Dynamic workspace routing
│   ├── auth/               # Auth pages (login, register, reset password, etc.)
│   ├── account/            # Customer account (orders, addresses, etc.)
│   └── api/                # Next.js API routes
├── components/             # Shared UI components
├── views/                  # Page-level view components (admin/ storefront/ account/ common/)
├── services/               # API service layer (axios wrappers)
├── hooks/                  # React hooks
├── contexts/               # React context providers
├── utils/                  # Utilities
│   ├── apiUrls.ts          # API base URL resolution (platform vs workspace)
│   └── authTokens.ts       # JWT storage (platform + workspace token management)
├── plugins/                # Workspace UI plugins (auto-loaded)
│   └── nexus/              # Example plugin
├── extensions/             # Composable extension registry (terminology, config, hooks)
├── configs/                # App-level configuration
├── i18n/                   # next-intl configuration
├── messages/               # Translation files (en.json, zh-hans.json)
├── types/                  # TypeScript types
├── styles/                 # Global styles
└── assets/                 # Static assets
```

---

## API URL Resolution

The client handles two API servers in Platform mode:

| Mode | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_WORKSPACE_API_URL` |
|------|-----------------------|---------------------------------|
| **Workspace-only** | Workspace server | — (not needed) |
| **Embedded Platform** | Same server for both | — (not needed) |
| **Standalone Platform** | Platform server | Workspace server |

`src/utils/apiUrls.ts` centralises all URL resolution:

- `getPlatformApiBaseUrl()` → reads `NEXT_PUBLIC_API_URL`
- `getWorkspaceApiBaseUrlFromEnv()` → reads `NEXT_PUBLIC_WORKSPACE_API_URL` → falls back to `NEXT_PUBLIC_API_URL`
- `getWorkspaceApiBaseUrlForStorage()` → checks localStorage override (set after token exchange) → falls back to env

`src/utils/authTokens.ts` manages JWT storage:

- `bfg_jwt:platform:<url>` — platform token
- `bfg_jwt:workspace:<url>` — workspace token (per-server)

---

## Plugin System

Plugins add workspace-specific UI extensions. Each plugin lives under `src/plugins/<id>/` and exports a default plugin object.

```
src/plugins/
└── nexus/
    ├── index.ts       # plugin manifest (id, name, routes, hooks)
    └── views/         # plugin pages
```

Running `npm run dev` or `npm run build` auto-discovers plugins and regenerates `src/plugins/loaders.generated.ts`. You only need to add a new directory — no manual registration.

To restrict which plugins load:
```env
NEXT_PUBLIC_ENABLED_PLUGINS=nexus,myapp
```

---

## i18n

Uses [next-intl](https://next-intl-docs.vercel.app/). Translation files are in `src/messages/`:

```
src/messages/
├── en.json
└── zh-hans.json
```

To add a language:
1. Add `src/messages/<locale>.json`
2. Register the locale in `src/i18n/request.ts`
3. Add to `LANGUAGES` in the Django backend settings

---

## Production Build

```bash
npm run build
npm run start
# or
npx serve@latest out    # if using static export
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_FILE_TRACING_ROOT=/app
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

### Vercel

The repo includes `vercel.json`. Set environment variables in the Vercel dashboard, then deploy:
```bash
vercel --prod
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `NEXT_PUBLIC_API_URL is not set` | Add `NEXT_PUBLIC_API_URL=http://localhost:8000` to `.env.local` |
| Login redirects to Platform login | Unset `NEXT_PUBLIC_PLATFORM_LOGIN_URL` for standalone workspace |
| Plugins not loading | Run `npm run prepare` or restart dev server |
| CORS errors from backend | Set `CORS_ALLOW_ALL_ORIGINS=True` in Django (dev only) or add your frontend origin |
| Media images 404 | Set `NEXT_PUBLIC_MEDIA_URL=http://localhost:8000/media` |
| Token exchange fails (Platform) | Ensure `PLATFORM_API_KEY` matches on both servers |
