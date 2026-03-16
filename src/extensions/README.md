# Extension System

A plugin-like extension system that allows new applications to extend and customize the frontend without modifying core client code.

## Features

- **Navigation Extensions**: Add, replace, or hide menu items
- **Page Slot Extensions**: Add custom content to page slots (before/after/replace/hide)
- **Data Hooks**: Intercept data loading and saving operations
- **Priority-based Conflict Resolution**: Multiple plugins can target the same item, highest priority wins
- **Server/Client Hybrid**: Navigation computed on server, slots/hooks on client

## Directory Structure

```
client/src/
├── extensions/           # Extension system core
│   ├── registry.ts        # Type definitions
│   ├── index.ts           # Server-side loader
│   ├── context.tsx        # ExtensionProvider (client)
│   ├── utils/             # Utility functions
│   └── hooks/             # React hooks
│
└── plugins/               # Extension plugins
    └── freight/           # Example: Freight module
        ├── index.ts       # Extension definition
        ├── nav.ts         # Navigation config
        └── slots/         # Page slot components (or sections/ for legacy)
```

## Usage

### 1. Enable Plugins

Add plugin dirs under `src/plugins/<id>/` with `index.ts`; they are auto-discovered by `npm run prepare`. Set `ENABLED_PLUGINS` (comma-separated):

```bash
ENABLED_PLUGINS=freight,custom-module
```

### 2. Create a Plugin

Create a directory under `plugins/` and export an `Extension`:

```typescript
// plugins/my-plugin/index.ts
import type { Extension } from '@/extensions/registry'

const myExtension: Extension = {
  id: 'my-plugin',
  name: 'My Plugin',
  priority: 100,
  
  adminNav: [/* ... */],
  sections: [/* ... */],   // page slot extensions (legacy key; slots preferred in types)
  dataHooks: [/* ... */]
}

export default myExtension
```

### 3. Navigation Extensions

```typescript
adminNav: [
  {
    id: 'add-menu',
    position: 'after',        // 'before' | 'after' | 'replace' | 'hide'
    targetId: 'store',        // Target menu item ID
    items: [/* MenuNode[] */],
    priority: 100             // Optional, overrides Extension priority
  }
]
```

### 4. Page Slot Extensions

Page **slots** define where extension content can be mounted (before/after/replace a slot). Use **blocks** for CMS-driven page content. Slots = "where"; blocks = "what".

```typescript
sections: [
  {
    id: 'my-slot-content',
    page: 'admin/store/products/edit',
    position: 'after',
    targetSlot: 'ProductOrganize',   // or targetSection (deprecated)
    component: MySlotComponent,
    priority: 100
  }
]
```

In page components use `usePageSlots(page)` and `renderSlot(slotId, visibleSlots, replacements, DefaultComponent, props)`.

#### Migration from sections (deprecated)

| Old | New |
|-----|-----|
| `usePageSections(page)` | `usePageSlots(page)` |
| `visibleSections` / `beforeSections` / `afterSections` | `visibleSlots` / `beforeSlots` / `afterSlots` |
| `renderSection(...)` | `renderSlot(slotId, visibleSlots, replacements, Component, props)` |
| `targetSection` in extension | `targetSlot` (or keep `targetSection` during compat window) |

```ts
// Before
const { visibleSections, beforeSections, afterSections, replacements } = usePageSections('admin/store/products/edit')
renderSection('ProductInfo', visibleSections, replacements, ProductInfo, {})

// After
const { visibleSlots, beforeSlots, afterSlots, replacements } = usePageSlots('admin/store/products/edit')
renderSlot('ProductInfo', visibleSlots, replacements, ProductInfo, {})
```

### 5. Data Hooks

```typescript
dataHooks: [
  {
    id: 'my-data-hook',
    page: 'admin/store/products/edit',
    priority: 100,
    onLoad: async (data) => {
      // Transform data on load
      return { ...data, customField: 'value' }
    },
    onSave: async (data) => {
      // Process data before save
      return data
    }
  }
]
```

## Deprecation (section → slot)

The following **section** APIs are deprecated and will be removed in the **next major version**. Use the Slot API instead.

| Deprecated | Use instead |
|------------|-------------|
| `usePageSections(page)` | `usePageSlots(page)` |
| `renderSection(...)` | `renderSlot(...)` |
| `getPageSectionReplacements(extensions, page)` | `getPageSlotReplacements(extensions, page)` |
| `DEFAULT_SECTIONS` | `DEFAULT_SLOTS` |
| Extension field `targetSection` | `targetSlot` |

**Scope:** All of the above remain supported during the compatibility window; only the listed names will be removed. No behavior change until removal.

## Examples

See `plugins/freight/` for a complete example.
