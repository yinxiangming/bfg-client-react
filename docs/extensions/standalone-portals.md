# Standalone extension portals

A deployed extension can provide an independent portal through
`src/plugins/<id>/app/portal/<prefix>/`. The generated route uses the root
application providers and an extension availability guard. The package supplies
its layout, authentication, authorization, navigation and metadata. API services
continue to authorize each operation.

For an extension named `sample`, the following source tree exposes `/hub` and
`/hub/history`.

```text
src/plugins/sample/app/portal/hub/
  layout.tsx
  page.tsx
  history/page.tsx
```

Run the existing prepare command to generate the routes and rewrites. The
physical namespace is `src/app/(portals)/plugins/sample/portals/hub/`. The generated
`sample/layout.tsx` owns the activation guard. Portal layouts live within the
guarded portal subtree, including prefixes matching the extension identifier.

Both public aliases and physical portal paths pass through the same availability
guard. Disabled deployment prevents page generation. Workspace activation controls
runtime access through the existing shared configuration. Portal pages receive
the root theme and locale providers, and the extension declares its supported
color modes through its skin contract.

Portal prefixes participate in the shared URL-claim validation. Reserved host
prefixes, existing host routes, another extension alias and public asset mounts
are checked before generated outputs are changed. The existing `/plugins/<id>`
namespace contains the guarded portal subtree.
When adopting portal routes, an extension must resolve any overlapping storefront
`portals` subtree before preparation can complete. Route sources use the existing
path and symlink validation.

Generated route files and manifests follow the current ownership and collision
rules. Existing storefront, administration, Account and auth route areas retain
their namespace mappings. Focused generation checks run with
`npm run test:plugin-portals` and retain their temporary fixtures.
