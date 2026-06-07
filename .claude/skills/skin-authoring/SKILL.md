---
name: skin-authoring
description: Author, audit, or update a bfg-client skin/theme (storefront + account + auth). Use when creating a new storefront skin, adding a theme, overriding storefront/account/auth pages per-theme, wiring skin assets/logos, debugging why a skin or page override is not picked up, or when working under src/skins/ or extensions/<plugin>/skins/. Covers the prepare.js sync pipeline, the three generated registries, CSS isolation, page-override route keys, and asset paths.
---

# bfg-client skin authoring

A **skin** (a.k.a. theme) restyles the storefront and, optionally, the account
and auth areas — without forking bfg-client. Skins are discovered from the
filesystem and wired by `scripts/prepare.js`; bfg-client needs **zero** code
changes to gain a new skin.

This guide is the source of truth for the mechanics. The authoritative
implementation is [`scripts/prepare.js`](../../../scripts/prepare.js) and
[`src/components/storefront/themes/resolve.ts`](../../../src/components/storefront/themes/resolve.ts).
If they disagree with this doc, the code wins — re-read it and update this skill.

## When this applies

- Creating a new skin (built-in or extension-contributed).
- Overriding a storefront / account / auth page for one skin only.
- Adding a skin logo / static asset.
- A skin or page override "isn't showing up" — debugging discovery.
- Auditing a skin for the CSS-isolation and id-uniqueness rules.

## Two skin sources

`prepare.js` scans both, in this order, and copies each into the bfg-client
component tree so the registry generators discover them:

| Source | Path | Public asset prefix | For |
|---|---|---|---|
| Built-in | `src/skins/<id>/` | `/skins/<id>/` | skins shipped inside bfg-client (`store`, `website`) |
| Extension | `src/plugins/<plugin>/skins/<id>/` | `/plugins/<plugin>/<id>/` | skins owned by a plugin (symlinked target of `extensions/<plugin>/skins/<id>/`) |

`<id>` is the skin id and **must equal** the storefront `config.theme` value
that selects it. Two sources contributing the same `<id>` make `prepare.js`
throw — pick distinct ids.

> **Extension skins live in the plugin, never in bfg-client.** Edit the source
> under `extensions/<plugin>/skins/<id>/`. The copies that land in
> `src/components/.../themes/<id>/` and `public/plugins/...` are **generated and
> gitignored** — never edit or commit those.

## Skin folder layout

```
<skin-root>/                     # src/skins/<id>/  OR  extensions/<plugin>/skins/<id>/
├── <shared>.css                 # (optional) any *.css at the root is copied into EVERY
│                                #   synced area dir, so each area css can @import it as a sibling
├── public/                      # (optional) static assets -> public/<prefix>/<id>/
│   └── logo.svg
├── storefront/                  # -> src/components/storefront/themes/<id>/
│   ├── theme.json               # metadata (displayName, description, homeComponent)
│   ├── Layout.tsx               # REQUIRED  (wraps storefront; mounts the root CSS class)
│   ├── Header.tsx               # REQUIRED
│   ├── Footer.tsx               # REQUIRED
│   ├── Home.tsx                 # optional fallback home (used when no CMS blocks)
│   ├── <name>.css               # component styles (imported by Layout.tsx)
│   └── pages/                   # optional per-route overrides — see route keys below
├── account/                     # -> src/components/account/themes/<id>/
│   ├── theme.json
│   ├── Layout.tsx               # optional — wraps all /account routes
│   └── pages/                   # optional per-route overrides (keys: dashboard, orders, …)
└── auth/                        # -> src/components/auth/themes/<id>/
    ├── theme.json
    ├── Layout.tsx               # optional
    └── pages/                   # optional (keys: login, register, forgot-password, …)
```

Only ship what you customize. Any area/page you omit falls back to bfg-client's
baseline (`src/views/...`). A skin can be storefront-only.

### Storefront registration requirement

A skin appears as a **selectable storefront theme** only if its `storefront/`
folder has **all three**: `Layout.tsx`, `Header.tsx`, `Footer.tsx`. Missing any
one → not registered. (Account/auth Layouts are optional.)

### Shared root CSS (tokens)

Put palette/type tokens in a root-level `*.css` (e.g. `tokens.css`). `prepare.js`
copies every root `*.css` into each synced area dir, so `storefront/x.css`,
`account/y.css`, and `auth/z.css` can all do `@import './tokens.css';` as a
sibling reference and stay in sync.

## CSS isolation — hard rule

Every selector in a skin's CSS **must** be nested under a single root class
`.<id>-theme-root` (e.g. `.preloved-theme-root`, `.website-theme-root`). No
naked `body`, `html`, `*`, `a`, `button` rules.

The skin's `Layout.tsx` renders that wrapper and imports its own stylesheet
(`import './x.css'`). When another theme is active, this Layout never mounts and
its CSS bundle never loads → switching skins is lossless and styles can't bleed
onto admin/account routes that bypass the Layout.

```tsx
// storefront/Layout.tsx (shape)
import './my-theme.css'
export default function MyLayout({ children }) {
  return (
    <div className="myid-theme-root" data-theme="myid">
      <MyHeader />
      <main>{children}</main>
      <MyFooter />
    </div>
  )
}
```

## theme.json

```json
{
  "displayName": "Preloved",
  "description": "Short blurb shown in admin theme picker.",
  "homeComponent": "Home"
}
```

`homeComponent` controls the home registry: a skin gets a home entry if it has
`storefront/Home.tsx` **or** `theme.json.homeComponent` is set and not `"none"`.

## Page overrides

Drop `pages/<key>.tsx` in an area to replace just that route for this skin.
Files are walked recursively: `pages/cart.tsx` → key `cart`;
`pages/checkout/success.tsx` → key `checkout/success`; `pages/index.tsx` → the
area-root key `''`.

### Storefront route keys

Source of truth: `src/components/storefront/themes/resolve.ts`.

| Route key | URL | File |
|---|---|---|
| `home` | `/` | `storefront/pages/home.tsx` |
| `product/[id]` | `/product/[id]` | `storefront/pages/product/[id].tsx` |
| `category/[slug]` | `/category/[slug]` | `storefront/pages/category/[slug].tsx` |
| `cart` | `/cart` | `storefront/pages/cart.tsx` |
| `checkout` | `/checkout` | `storefront/pages/checkout.tsx` |
| `checkout/success` | `/checkout/success` | `storefront/pages/checkout/success.tsx` |
| `search` | `/search` | `storefront/pages/search.tsx` |
| `cms` | `/[slug]` catch-all | `storefront/pages/cms.tsx` |

A route page calls `resolveStorefrontPage('<key>')`; if the active theme
registered an override, it renders it, else the baseline view. Account/auth use
the same `pages/<key>.tsx` convention via `ACCOUNT_SKIN_REGISTRY` /
`AUTH_SKIN_REGISTRY`.

**Plugin-owned routes** (e.g. a plugin's `/consign`) are not in the built-in key
list. To make such a route skinnable, have the plugin's `app/.../page.tsx` call
`resolveStorefrontPage('<key>')` itself and fall back to its default — then a
skin can add `pages/<key>.tsx`. This keeps the override generic (no skin name in
the route).

### Override props

Read the matching `app/(storefront)/<route>/page.tsx` for exact props. Quick ref:
- `home` → `{ pageData, locale, workspace_id, workspace_slug }`
- `product/[id]` → `{ productId, id }`
- `category/[slug]` → `{ slug }`
- `cart` / `checkout` / `checkout/success` / `search` / `cms` → no payload props
  (the `cms` override commonly receives `{ pageData, locale, slug }` from the
  catch-all — confirm in `app/(storefront)/[slug]/page.tsx`)

Override components need `'use client'` if they use state/effects/browser APIs.

## Asset paths

Reference assets by their **synced public path**, not the source path:
- Built-in skin: `/skins/<id>/<file>` (e.g. `/skins/store/logo.svg`)
- Extension skin: `/plugins/<plugin>/<id>/<file>` (e.g. `/plugins/resale/preloved/logo.svg`)

Put the file under `<skin-root>/public/<file>` (subdirs allowed, e.g.
`public/images/hero.png` → `/plugins/<plugin>/<id>/images/hero.png`).

## The sync pipeline (`npm run prepare`)

`npm run prepare` (alias for `node scripts/prepare.js`) runs on every
`npm run dev` / `npm run build`, in order:

1. `generatePluginLoaders()`
2. `syncPluginRoutes()`
3. `syncSkins()` — clean previous outputs (via `.skin-sync-manifest.json`),
   copy built-in then extension skins into `src/components/<area>/themes/<id>/`
   and `public/<prefix>/<id>/`; throw on duplicate ids.
4. `generateThemeRegistry()` → `src/components/storefront/themes/registry.generated.ts`
   exporting `THEME_REGISTRY`, `HOME_REGISTRY`, `STOREFRONT_PAGE_OVERRIDES`.
5. `generateAreaSkinRegistry('account', …)` → `ACCOUNT_SKIN_REGISTRY`.
6. `generateAreaSkinRegistry('auth', …)` → `AUTH_SKIN_REGISTRY`.

Generated `registry.generated.ts`, the synced `themes/<id>/` dirs, and
`public/plugins/**` are **gitignored** — sources stay in `src/skins/` or the
extension.

Expected stdout (ids vary):
```
Skins: builtin:store, builtin:website, resale:preloved -> N file(s)
Theme registry: preloved, store, website
  preloved page overrides: cms, consign
account skins: preloved, website
auth skins: preloved, website
```

## Theme selection

The active skin is the storefront `config.theme` value (set in admin →
Storefront Settings → Theme, resolved per workspace by the API). `resolve.ts`
reads `config.theme` and looks up the registries by that id. So **skin id ===
config.theme**.

## Create a new skin — checklist

1. Choose source: built-in (`src/skins/<id>/`) or extension
   (`extensions/<plugin>/skins/<id>/`). Pick a unique `<id>`.
2. Create `storefront/{theme.json,Layout.tsx,Header.tsx,Footer.tsx}` (+ `Home.tsx`
   if you want a custom home). Add `account/` and `auth/` only if customizing them.
3. Scope **all** CSS under `.<id>-theme-root`; have `Layout.tsx` render that
   wrapper and `import` the stylesheet. Keep tokens in a root `*.css`.
4. Put assets in `public/`; reference them by the synced path
   (`/skins/<id>/…` or `/plugins/<plugin>/<id>/…`).
5. Add page overrides under `<area>/pages/<key>.tsx` as needed.
6. `cd src/client && npm run prepare` → confirm your id shows in the stdout and
   the `registry.generated.ts` files.
7. In admin, set the workspace storefront theme to `<id>` and verify each route.

## Debugging discovery

- **Skin not selectable** → storefront folder missing one of
  `Layout/Header/Footer.tsx`; or you forgot to re-run `npm run prepare`.
- **`prepare.js` throws "skin id … contributed by both …"** → two sources use the
  same id. Rename one.
- **Page override ignored** → wrong route key (check `resolve.ts`), file not under
  `pages/`, or the route's `page.tsx` doesn't call `resolveStorefrontPage`
  (plugin routes must opt in). Confirm it appears under `… page overrides:` in
  prepare stdout.
- **CSS edits don't apply in dev after `prepare`** → Turbopack's persistent
  `.next/dev` cache can serve a stale CSS chunk even across a restart. Fix:
  stop dev, `rm -rf .next`, restart. (Verify the rule is actually missing with
  `getComputedStyle` before nuking the cache.)
- **Asset 404** → wrong public prefix. Built-in = `/skins/<id>/…`, extension =
  `/plugins/<plugin>/<id>/…`. File must be under `<skin-root>/public/`.
- **Styles leak to admin/account** → a selector isn't nested under
  `.<id>-theme-root`. Fix the isolation.

## Don't

- Don't edit/commit anything under `src/components/**/themes/<id>/`,
  `public/plugins/**`, or `*.generated.ts` — they're regenerated.
- Don't put skin-specific or business logic into bfg-client's generic code; an
  extension skin's files belong entirely under `extensions/<plugin>/skins/<id>/`.
- Don't write unscoped global CSS.
