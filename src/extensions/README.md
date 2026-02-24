# Extension System

A plugin-like extension system that allows new applications to extend and customize the frontend without modifying core client code.

## Features

- **Navigation Extensions**: Add, replace, or hide menu items
- **Page Section Extensions**: Add custom sections to pages (before/after/replace/hide)
- **Data Hooks**: Intercept data loading and saving operations
- **Priority-based Conflict Resolution**: Multiple plugins can target the same item, highest priority wins
- **Server/Client Hybrid**: Navigation computed on server, sections/hooks on client

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
        └── sections/      # Page section components
```

## Usage

### 1. Enable Plugins

Register each plugin in `src/plugins/loaders.ts` with a static import, then set environment variable `ENABLED_PLUGINS` (comma-separated):

```typescript
// src/plugins/loaders.ts
export const PLUGIN_LOADERS = {
  freight: () => import('@/plugins/freight'),
  'custom-module': () => import('@/plugins/custom-module'),
}
```

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
  sections: [/* ... */],
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

### 4. Page Section Extensions

```typescript
sections: [
  {
    id: 'my-section',
    page: 'admin/store/products/edit',
    position: 'after',
    targetSection: 'ProductOrganize',
    component: MySectionComponent,
    priority: 100
  }
]
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

## Examples

See `plugins/freight/` for a complete example.
