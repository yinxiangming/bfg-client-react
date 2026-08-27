import type { Components, Theme } from '@mui/material/styles'

/**
 * Admin surface overrides — one design language for the back office.
 *
 * The admin already had a token system (`--at-*` in `styles/admin-skins.css`)
 * but only SchemaTable/SchemaForm consumed it. Everything built from plain MUI
 * — cards, dialogs, tabs, menus, inputs — kept Material's defaults, so a page
 * with a table and a page with a form looked like two different products:
 * 4px vs 8px radii, elevation shadows next to flat hairlines, UPPERCASE tabs
 * next to sentence-case table headers.
 *
 * These overrides point MUI at the same tokens. Skins keep working (they only
 * change the token values), and nothing needs touching at the call sites.
 *
 * Everything is scoped to `[data-admin-skin]`, which `AdminSkinProvider` puts
 * on <html> for admin routes only and removes on unmount. That keeps the
 * storefront and account areas on stock MUI, and — because the attribute is on
 * the root element rather than a layout div — still covers portalled surfaces
 * (Dialog, Menu, Popover) that render outside the admin DOM subtree.
 */

/** Prefix a rule so it only applies inside the admin shell, portals included. */
const admin = (styles: Record<string, unknown>) => ({ '[data-admin-skin] &': styles })

/**
 * Shared inset for anything that spans a card edge to edge: dialog header,
 * dialog footer, section rows. Keeping one value is what makes headers, fields
 * and action bars line up down a single left edge.
 */
export const ADMIN_GUTTER = 24

export const adminSurfaceOverrides: Components<Theme> = {
  MuiCard: {
    styleOverrides: {
      root: admin({
        backgroundColor: 'var(--at-card-bg, var(--mui-palette-background-paper))',
        backgroundImage: 'none',
        border: '1px solid var(--at-card-border, var(--mui-palette-divider))',
        borderRadius: 'var(--at-card-radius, 8px)',
        boxShadow: 'var(--at-card-shadow, none)'
      })
    }
  },

  MuiPaper: {
    styleOverrides: {
      // Menus, popovers and autocomplete dropdowns; Dialog gets its own rule.
      root: admin({
        backgroundImage: 'none'
      })
    }
  },

  MuiMenu: {
    styleOverrides: {
      paper: admin({
        border: '1px solid var(--at-card-border, var(--mui-palette-divider))',
        borderRadius: 'var(--at-control-radius, 8px)'
      }),
      list: admin({
        paddingBlock: 4
      })
    }
  },

  MuiMenuItem: {
    styleOverrides: {
      root: admin({
        fontSize: 13,
        minHeight: 36,
        borderRadius: 6,
        marginInline: 4,
        paddingBlock: 6
      })
    }
  },

  MuiDialog: {
    styleOverrides: {
      paper: admin({
        backgroundImage: 'none',
        border: '1px solid var(--at-card-border, var(--mui-palette-divider))',
        borderRadius: 'var(--at-card-radius, 8px)'
      })
    }
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: admin({
        fontFamily: 'var(--at-font-display, inherit)',
        fontSize: 15,
        fontWeight: 600,
        lineHeight: 1.5,
        padding: `16px ${ADMIN_GUTTER}px`,
        borderBottom: '1px solid var(--at-card-border, var(--mui-palette-divider))'
      })
    }
  },

  MuiDialogContent: {
    styleOverrides: {
      root: admin({
        padding: `${ADMIN_GUTTER}px`,

        // A SchemaForm hosted in a dialog is the dialog's body, not a card
        // sitting inside it — drop its surface so there is one border, not two.
        // Descendant, not child: dialogs commonly wrap the form in a Box for
        // their own tab strip.
        '& .at-schema-form': {
          border: 0,
          borderRadius: 0,
          backgroundColor: 'transparent'
        },

        // The form lays out its own header, body and action bar on this same
        // gutter, so the padding here would only double it — most call sites
        // already pass `sx={{ p: 0 }}` by hand, and the handful that forgot
        // were the ones sitting 48px off the dialog's own title. Zeroing it
        // here makes both spellings render identically.
        //
        // It also has to be zero at the bottom regardless: the form docks its
        // action bar to the bottom of this scrollport, and a sticky element
        // stops at the padding box, so bottom padding would leave a strip of
        // content scrolling past underneath the bar.
        '&:has(.at-schema-form)': {
          padding: 0
        }
      })
    }
  },

  MuiDialogActions: {
    styleOverrides: {
      root: admin({
        gap: 8,
        padding: `12px ${ADMIN_GUTTER}px`,
        borderTop: '1px solid var(--at-card-border, var(--mui-palette-divider))',
        // MUI's default `& > :not(:first-of-type) { margin-left: 8px }` fights
        // the gap above and double-spaces the buttons.
        '& > :not(style) ~ :not(style)': { marginLeft: 0 }
      })
    }
  },

  MuiTab: {
    styleOverrides: {
      root: admin({
        // Material's shouty default. Every other label in the admin — nav,
        // table headers, section titles, badges — is sentence case.
        textTransform: 'none',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0,
        minHeight: 40
      })
    }
  },

  MuiButton: {
    defaultProps: {
      disableElevation: true
    },
    styleOverrides: {
      root: admin({
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 'var(--at-control-radius, 8px)'
      }),
      sizeSmall: admin({
        fontSize: 13
      })
    }
  },

  MuiIconButton: {
    styleOverrides: {
      root: admin({
        borderRadius: 'var(--at-control-radius, 8px)'
      })
    }
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: admin({
        borderRadius: 'var(--at-field-radius, 8px)',
        backgroundColor: 'var(--at-field-bg, transparent)'
      })
    }
  },

  MuiChip: {
    styleOverrides: {
      root: admin({
        borderRadius: 'var(--at-badge-radius, 6px)',
        fontWeight: 500
      })
    }
  },

  MuiTableCell: {
    styleOverrides: {
      root: admin({
        borderBottomColor: 'var(--at-divider, var(--mui-palette-divider))'
      }),
      head: admin({
        fontSize: 'var(--at-head-size, 12px)',
        fontWeight: 'var(--at-head-weight, 600)',
        textTransform: 'var(--at-head-transform, none)' as 'none',
        color: 'var(--at-head-fg, var(--mui-palette-text-secondary))'
      })
    }
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: admin({
        fontSize: 12,
        borderRadius: 6
      })
    }
  }
}

export default adminSurfaceOverrides
