---
name: vercel-monorepo-ci-prebuilt
description: >-
  Guides correct Vercel CLI usage for `vercel pull`, `vercel build`, and
  `vercel deploy --prebuilt` in CI when the app lives in a monorepo subdirectory
  (separate from repo root). Covers rootDirectory / cwd interaction, env-based
  project linking, and safe fixes. Use when setting up GitHub Actions (or similar)
  for Vercel prebuilt deployments, debugging duplicated paths, ENOENT during
  install, wrong project targeting, or empty prebuilt uploads.
---

# Vercel monorepo CI — prebuilt deploy

## Goal

Run **`vercel pull` → `vercel build` → `vercel deploy --prebuilt`** in CI with the shell’s working directory set to the **application root** (the folder that contains `package.json`, `next.config.*`, and usually `.vercel/` after link/pull). This doc is **not** tied to a specific repo layout; substitute your own app path (e.g. `apps/web`, `frontend`).

## How the CLI uses `cwd`, `rootDirectory`, and env vars

1. **`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both set)**  
   The CLI resolves the project from these IDs. The returned link **does not include `repoRoot`**. Subsequent path logic uses the **current working directory** as the filesystem root unless the CLI adjusts it.

2. **Project `rootDirectory` from the Vercel API** (often set in the dashboard for Git-connected monorepos)  
   Defines a path **relative to the repository root** where the app lives. The deploy command validates that **`join(cwd, rootDirectory)`** exists as a directory when `rootDirectory` is non-empty.

3. **Typical CI setup**  
   Jobs set `working-directory` to the **app folder** so `npm ci` / `vercel build` run in the right place. If the dashboard still has **`rootDirectory`** set to that same relative segment (e.g. `apps/web`), validation becomes **`join(appCwd, "apps/web")`** → a **duplicated segment** and errors such as “path …/apps/web/apps/web does not exist”, or broken install steps (`spawn sh ENOENT`).

4. **`.vercel/project.json` after `vercel pull`**  
   Pulled settings may include `rootDirectory`. Stripping or emptying it in the local file can fix **`vercel build`** (which reads local project settings) but **`vercel deploy` still uses API project settings** for validation and upload routing unless those are aligned.

## Recommended pattern (generic)

1. **Run pull, build, and prebuilt deploy from the same app directory** (the folder that is the real Next.js / Node app root).

2. **Align API `rootDirectory` with that directory**  
   For CLI-driven prebuilt deploys where CI **already** runs inside the app folder, the effective “root” for the CLI is the app directory, not the monorepo root. The clean approach is to set the project’s **`rootDirectory` to `null` / empty** in Vercel so the API does not append a second path segment. Options:
   - **Dashboard**: Project → Settings → set **Root Directory** empty (or “.” per product UI), **or**
   - **REST API**: `PATCH /v9/projects/{idOrName}` with body `{"rootDirectory": null}` (use `teamId` query parameter when using a team scope), authenticated with the same token used for the CLI.

3. **Run deploy after build**  
   `vercel deploy --prebuilt` must find `.vercel/output` under the app directory (or under `join(cwd, rootDirectory)` when the CLI applies monorepo rules). After `rootDirectory` is cleared on the project, the usual layout is **`$APP_ROOT/.vercel/output`**.

## Tradeoff: Git-connected production builds on Vercel

If the **same** Vercel project is used for:

- **Git pushes** (Vercel builds from the connected repo), and  
- **CLI prebuilt from CI** in a subdirectory,

then clearing **`rootDirectory`** may **break or change** Git-based builds that relied on a non-empty root directory. Mitigations:

- Use **two projects** (one for Git with root directory set, one for CLI prebuilt-only), or  
- Rely on **one** pipeline (only CI prebuilt, or only Vercel Git builds) and configure the project accordingly.

## Anti-patterns (avoid)

- **Symlinking the entire app tree into the repository root** so the CLI runs from the monorepo root: top-level names like `src/` often **collide** with existing monorepo folders and can create **symlink loops** or destroy the checkout.
- **Relying only on editing `.vercel/project.json`** to clear `rootDirectory` and expecting **`vercel deploy`** to ignore the API — deploy still consults **remote project settings** for validation.
- **Omitting one of `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`** while the other is set — the CLI warns and may behave inconsistently; set **both** or neither (neither → rely on `.vercel` link from `vercel link` / `vercel pull`).

## Quick symptom → cause map

| Symptom | Likely cause |
|--------|----------------|
| Path contains **two repeated** subdirectory segments | `cwd` is already the app dir; API **`rootDirectory`** repeats that segment. |
| **`spawn sh ENOENT`** during `vercel build` install | Often bad combined paths or invalid `cwd` for the install command; check `rootDirectory` vs actual `cwd`. |
| **`vercel deploy` targets the wrong project** | Wrong or missing project linkage; ensure **both** org and project IDs match the intended project when using env-based linking. |
| **Tiny upload / remote build errors** after `--prebuilt` | Prebuilt bundle not found or wrong root; align **`rootDirectory`**, **`cwd`**, and `.vercel/output` location. |

## Checklist for new CI workflows

- [ ] Single consistent **`working-directory`** for pull, build, and deploy (app root).  
- [ ] **`VERCEL_TOKEN`** with deploy permission.  
- [ ] If using **`VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`**, set **both**; verify project name in logs.  
- [ ] **`rootDirectory`** on the Vercel project matches how CI runs (usually **empty** when CI `cd`s into the app).  
- [ ] Do not duplicate monorepo paths via dashboard **Root Directory** + job **`cd`** into the same folder.
