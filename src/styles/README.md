# Styles Directory Structure

This directory contains all CSS styles organized by category for better maintainability and scalability.

## File Structure

### Core Styles (Generic Components)

- **`variables.css`** - CSS custom properties (variables) for theming
  - Light and dark mode color definitions
  - MUI palette variables
  - Shadow and border radius variables

- **`base.css`** - Base styles and utility classes
  - Body styles
  - Utility classes (`.bg-*`, `.text-*`)

- **`card.css`** - Generic card component styles
  - `.card` - Base card component
  - `.card-header` - Card header styles
  - Supports dark mode

- **`table.css`** - Generic table component styles
  - `.table` - Standard table
  - `.table-grid` - Grid-based table layout
  - Table head, row, and cell styles
  - Supports dark mode

- **`button.css`** - Generic button component styles
  - `.btn` - Base button
  - Variants: `.btn.primary`, `.btn.secondary`, `.btn.danger`, `.btn.ghost`
  - Supports dark mode

- **`form.css`** - Generic form component styles
  - `.form` - Form container
  - `.form-group` - Form field group
  - `.form-label`, `.form-input` - Form elements
  - `.form-error`, `.form-help` - Form feedback
  - Supports dark mode

- **`menu.css`** - Generic menu component styles
  - Menu items, submenus, sections
  - Badge styles
  - Nested menu levels
  - Supports dark mode

- **`layout.css`** - Generic layout component styles
  - `.sidebar` - Sidebar component
  - `.topbar` - Topbar component
  - `.content` - Content area
  - `.footer` - Footer component
  - Supports dark mode

- **`theme.css`** - Theme switcher component styles
  - Theme switcher dropdown
  - Theme option styles
  - Supports dark mode

### Business Module Styles

- **`auth.css`** - Authentication page styles
  - Auth layout, cards, forms
  - Login/register specific styles
  - Supports dark mode

- **`admin.css`** - Admin layout styles
  - Admin shell, main, topbar, content
  - Admin-specific card and table styles
  - Overview grid and activity list
  - Info card styles
  - Supports dark mode

## Usage

All styles are imported in `app/globals.css`:

```css
@import '../styles/variables.css';
@import '../styles/base.css';
@import '../styles/card.css';
/* ... etc */
```

## Best Practices

1. **Generic vs Business**: 
   - Use generic class names (`.card`, `.table`, `.btn`) for reusable components
   - Use business-specific class names (`.admin-*`, `.auth-*`) only when necessary

2. **Dark Mode**: 
   - Always include dark mode styles using `[data-mode='dark']` selector
   - Use CSS variables when possible for easier theming

3. **File Size**: 
   - Keep each file focused on a single component category
   - If a file grows too large (>300 lines), consider splitting further

4. **Naming Convention**:
   - Generic components: `.component-name`
   - Business modules: `.module-component-name`
   - Variants: `.component-name.variant-name`

## Migration Notes

- `admin-*` classes are kept for backward compatibility
- New code should prefer generic class names (`.card`, `.table`, etc.)
- Gradually migrate existing `admin-*` usage to generic classes

