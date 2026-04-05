# Client CLAUDE.md

## Extension Symlinks & Module Resolution

Extensions (e.g. `extensions/channels-client/`) are symlinked into `src/plugins/<name>/` from outside the client directory. Turbopack (Next.js 16 default bundler) resolves symlinks to their real paths and then looks for `node_modules` relative to the real path — which is outside `src/client/`, so it fails to find dependencies.

**Fix**: Each extension directory must have a `node_modules` symlink pointing to the client's `node_modules`:

```bash
ln -s ../../src/client/node_modules extensions/<name>-client/node_modules
```

These symlinks are gitignored via `extensions/*/node_modules` in the root `.gitignore`.

The `webpack.resolve.modules` config in `next.config.ts` serves as a fallback for non-Turbopack builds (`--no-turbopack`).

When creating a new client extension, always create this `node_modules` symlink.
