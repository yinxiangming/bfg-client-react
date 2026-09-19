---
name: bfg-client-extension-implement
description: Implements or integrates a contract-defined BFG Client extension, including registry, routes, schema UI, translations, and skins.
---

# BFG Client extension implementation

Use this project-level skill when an extension repository supplies a versioned
contract and needs public, account, or administration UI on the BFG Client
host.

## Required input

Before editing, require:

- extension repository path and extension id;
- versioned contract and skin-manifest paths;
- exact Client baseline revision;
- dispatch result path inside the extension repository.

Stop with a precise blocker when an input or baseline is unavailable. Do not
invent API fields or silently fall back to mock data.

## Ownership decision

- Domain routes, screens, translations, components, and skin packages belong
  to the extension Client package.
- Generic registry, slot, schema, route-generation, data-loading, and skin
  runtime changes belong to BFG Client.
- Host adapters stay thin and cannot embed one extension's content or policy.

Record every host-owned change and why it is reusable beyond the requesting
extension.

## Client invariants

- Use the existing extension registry, generated loaders/routes, and
  schema-driven UI before adding parallel infrastructure.
- Use the established authenticated API helpers. Browser code must not contain
  Server credentials, internal origins, or tenant-selection secrets.
- Treat valid empty collections as empty states, not 404 pages.
- Respect anonymous/member/staff/admin route guards from the shared contract.
- A skin manifest is authoritative for supported color modes. A light-only
  skin must force light mode across storefront, account, and auth and hide
  unavailable toggles.
- Customer names, logos, claims, contacts, and hero media come from Workspace
  or CMS configuration, not the reusable extension package.
- Maintain keyboard navigation, semantic headings, focus behavior, contrast,
  responsive layout, and reduced-motion behavior.

## Implementation flow

1. Verify `HEAD` equals the requested baseline and the worktree is clean.
2. Inspect the current prepare script, extension registry, route hosts, schema
   components, API helpers, translations, and skin resolvers at that revision.
3. Map contract routes and page slots to extension-owned modules and identify
   only the generic host gaps needed.
4. Implement typed API adapters, route modules, UI, translations, and skins.
5. Regenerate derived registries with the repository's prepare command; do not
   hand-edit generated files.
6. Run lint, type checking, build, focused UI tests, accessibility checks, and
   skin/route smoke tests supported by the repository.
7. Write the dispatch result. Do not push, merge, write remote Workspace data,
   or deploy without explicit authorization.

## Required verification

- extension enabled and disabled behavior;
- anonymous/member/staff/admin route access;
- list, detail, loading, error, and empty states;
- typed compatibility with the supplied API contract;
- all declared areas for every skin and enforced color-mode constraints;
- no customer-specific data in the reusable package;
- generated registry/route output reproducibility;
- responsive and keyboard-accessible critical paths.

## Dispatch result

Write JSON at the requested extension-repository path containing:

- `status`: `complete`, `blocked`, or `failed`;
- Client baseline and resulting commit/worktree revision;
- contract version and extension id;
- extension-owned files and host-owned files changed;
- routes, navigation entries, translations, and skins added;
- commands executed with exact results;
- compatibility notes, blockers, and unperformed remote actions.
