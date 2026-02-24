// MUI module augmentation for custom variants used in the codebase.
// This is required for TypeScript to accept `variant="tonal"` on MUI components.

import '@mui/material/Button'
import '@mui/material/Chip'
import '@mui/material/Pagination'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    tonal: true
  }
}

declare module '@mui/material/Pagination' {
  interface PaginationPropsVariantOverrides {
    tonal: true
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    tonal: true
  }
}

