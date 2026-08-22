'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import type { InputLabelProps } from '@mui/material/InputLabel'

const TextFieldStyled = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& .MuiInputLabel-root': {
    transform: 'none',
    width: 'fit-content',
    maxWidth: '100%',
    lineHeight: 1.153,
    position: 'relative',
    fontSize: theme.typography.body2.fontSize,
    marginBottom: theme.spacing(1),
    color: 'var(--mui-palette-text-primary)',
    '&:not(.Mui-error).MuiFormLabel-colorPrimary.Mui-focused': {
      color: 'var(--mui-palette-primary-main) !important'
    },
    '&.Mui-disabled': {
      color: 'var(--mui-palette-text-disabled)'
    },
    '&.Mui-error': {
      color: 'var(--mui-palette-error-main)'
    }
  },
  '& .MuiInputBase-root': {
    backgroundColor: 'transparent !important',
    border: `1px solid var(--mui-palette-customColors-inputBorder)`,
    '&:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error):hover': {
      borderColor: 'var(--mui-palette-action-active)'
    },
    '&:before, &:after': {
      display: 'none'
    },
    '&.MuiInputBase-sizeSmall': {
      borderRadius: 'var(--mui-shape-borderRadius)'
    },
    '&.Mui-error': {
      borderColor: 'var(--mui-palette-error-main)'
    },
    '&.Mui-focused': {
      borderWidth: 2,
      '& .MuiInputBase-input:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
        transform: 'translateX(4px)'
      },
      '& :not(textarea).MuiFilledInput-input': {
        padding: '6.25px 13px'
      },
      '&:not(.Mui-error).MuiInputBase-colorPrimary': {
        borderColor: 'var(--mui-palette-primary-main)',
        boxShadow: 'var(--mui-customShadows-primary-sm)'
      },
      '&.MuiInputBase-colorSecondary': {
        borderColor: 'var(--mui-palette-secondary-main)'
      },
      '&.MuiInputBase-colorInfo': {
        borderColor: 'var(--mui-palette-info-main)'
      },
      '&.MuiInputBase-colorSuccess': {
        borderColor: 'var(--mui-palette-success-main)'
      },
      '&.MuiInputBase-colorWarning': {
        borderColor: 'var(--mui-palette-warning-main)'
      },
      '&.MuiInputBase-colorError': {
        borderColor: 'var(--mui-palette-error-main)'
      },
      '&.Mui-error': {
        borderColor: 'var(--mui-palette-error-main)'
      }
    },
    '&.Mui-disabled': {
      backgroundColor: 'var(--mui-palette-action-hover) !important'
    }
  },
  '& .MuiInputAdornment-root': {
    marginBlockStart: '0px !important',
    '&.MuiInputAdornment-positionStart + .MuiInputBase-input:not(textarea)': {
      paddingInlineStart: '0px !important'
    }
  },
  '& .MuiInputBase-inputAdornedEnd.MuiInputBase-input': {
    paddingInlineEnd: '0px !important'
  },
  '& .MuiInputBase-sizeSmall.MuiInputBase-adornedStart.Mui-focused': {
    paddingInlineStart: '13px',
    '& .MuiInputBase-input': {
      paddingInlineStart: '0px !important'
    }
  },
  '& .MuiInputBase-sizeSmall.MuiInputBase-adornedStart:not(.MuiAutocomplete-inputRoot)': {
    paddingInlineStart: '14px'
  },
  '& .MuiInputBase-sizeSmall.MuiInputBase-adornedEnd:not(.MuiAutocomplete-inputRoot)': {
    paddingInlineEnd: '14px'
  },
  '& .MuiInputBase-sizeSmall.MuiInputBase-adornedEnd.Mui-focused:not(.MuiAutocomplete-inputRoot)': {
    paddingInlineEnd: '13px',
    '& .MuiInputBase-input': {
      paddingInlineEnd: '0px !important'
    }
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedStart.Mui-focused': {
    paddingInlineStart: '15px',
    '& .MuiInputBase-input': {
      paddingInlineStart: '0px !important'
    }
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedStart': {
    paddingInlineStart: '16px'
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedEnd.Mui-focused': {
    paddingInlineEnd: '15px',
    '& .MuiInputBase-input': {
      paddingInlineEnd: '0px !important'
    }
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedEnd': {
    paddingInlineEnd: '16px'
  },
  '& .MuiInputAdornment-sizeMedium': {
    'i, svg': {
      fontSize: '1.25rem'
    }
  },
  '& .MuiInputBase-input': {
    '&:not(textarea).MuiInputBase-inputSizeSmall': {
      padding: '7.25px 14px'
    },
    '&:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
      transition: theme.transitions.create(['opacity', 'transform'], {
        duration: theme.transitions.duration.shorter
      })
    }
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-root': {
    borderRadius: '8px',
    fontSize: '17px',
    lineHeight: '1.41',
    '& .MuiInputBase-input': {
      padding: '10.8px 16px'
    },
    '&.Mui-focused': {
      '& .MuiInputBase-input': {
        padding: '9.8px 15px'
      }
    }
  },
  '& .MuiFormHelperText-root': {
    lineHeight: 1.154,
    margin: theme.spacing(1, 0, 0),
    fontSize: theme.typography.body2.fontSize,
    '&.Mui-error': {
      color: 'var(--mui-palette-error-main)'
    },
    '&.Mui-disabled': {
      color: 'var(--mui-palette-text-disabled)'
    }
  },
  '& .MuiSelect-select.MuiInputBase-inputSizeSmall, & .MuiNativeSelect-select.MuiInputBase-inputSizeSmall': {
    '& ~ i, & ~ svg': {
      inlineSize: '1.125rem',
      blockSize: '1.125rem'
    }
  },
  '& .MuiSelect-select': {
    minHeight: 'unset !important',
    lineHeight: '1.4375em',
    '&.MuiInputBase-input': {
      paddingInlineEnd: '32px !important'
    }
  },
  '& .Mui-focused .MuiSelect-select': {
    '& ~ i, & ~ svg': {
      right: '0.9375rem'
    }
  },
  '& .MuiSelect-select:focus, & .MuiNativeSelect-select:focus': {
    backgroundColor: 'transparent'
  },
  '& :not(.MuiInputBase-sizeSmall).MuiAutocomplete-inputRoot': {
    paddingBlock: '5.55px',
    '& .MuiAutocomplete-input': {
      paddingInline: '8px !important',
      paddingBlock: '5.25px !important'
    },
    '&.Mui-focused .MuiAutocomplete-input': {
      paddingInlineStart: '7px !important'
    },
    '&.Mui-focused': {
      paddingBlock: '4.55px !important'
    },
    '& .MuiAutocomplete-endAdornment': {
      top: 'calc(50% - 12px)'
    }
  },
  '& .MuiAutocomplete-inputRoot.MuiInputBase-sizeSmall': {
    paddingBlock: '4.75px !important',
    paddingInlineStart: '10px',
    '&.Mui-focused': {
      paddingBlock: '3.75px !important',
      paddingInlineStart: '9px',
      '.MuiAutocomplete-input': {
        paddingBlock: '2.5px',
        paddingInline: '3px !important'
      }
    },
    '& .MuiAutocomplete-input': {
      paddingInline: '3px !important'
    }
  },
  '& .MuiAutocomplete-inputRoot': {
    display: 'flex',
    gap: '0.25rem',
    '& .MuiAutocomplete-tag': {
      margin: 0
    }
  },
  '& .MuiAutocomplete-inputRoot.Mui-focused .MuiAutocomplete-endAdornment': {
    right: '.9375rem'
  },
  '& .MuiInputBase-multiline': {
    '&.MuiInputBase-sizeSmall': {
      padding: '6px 14px',
      '&.Mui-focused': {
        padding: '5px 13px'
      }
    },
    '& textarea.MuiInputBase-inputSizeSmall:placeholder-shown': {
      overflowX: 'hidden'
    }
  },

  // ── Admin density ────────────────────────────────────────────────────────
  // The template ships fields at body1 (16px) with a 14px label, which is the
  // right scale for the storefront's checkout but a size too big next to the
  // admin's 13px tables and 11px column heads — forms read sparse and pushed
  // dialogs past the fold. Admin routes only (`[data-admin-skin]` on <html>),
  // so storefront and account forms keep the larger, friendlier scale.
  '[data-admin-skin] &': {
    '& .MuiInputLabel-root': {
      fontSize: '0.8125rem',
      marginBottom: theme.spacing(0.75)
    },
    '& .MuiInputBase-root': {
      fontSize: '0.8125rem',
      lineHeight: 1.5
    },
    '& .MuiInputBase-input:not(textarea).MuiInputBase-inputSizeSmall': {
      padding: '8.5px 12px'
    },
    '& .MuiInputBase-sizeSmall.Mui-focused .MuiInputBase-input:not(textarea)': {
      padding: '7.5px 11px'
    },
    '& .MuiInputBase-multiline.MuiInputBase-sizeSmall': {
      padding: '8.5px 12px',
      '&.Mui-focused': {
        padding: '7.5px 11px'
      }
    },
    '& .MuiFormHelperText-root': {
      fontSize: '0.6875rem',
      margin: theme.spacing(0.75, 0, 0)
    },
    // Belt and braces: any control that slips through at the default medium
    // size — an Autocomplete passing its own `size` down through renderInput,
    // say — still lands on the same 38px baseline as the fields beside it,
    // instead of standing 9px taller in the middle of a filter toolbar.
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-root': {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      '& .MuiInputBase-input': { padding: '8.5px 12px' },
      '&.Mui-focused .MuiInputBase-input': { padding: '7.5px 11px' }
    },
    // An Autocomplete pads its own root (4.75px, !important above) AND its
    // inner input, so the two stack: the control comes out ~47px next to the
    // 38px of every plain field beside it in a filter toolbar. The root's
    // padding is spoken for, so the inner input takes the remainder —
    // 38 = 2 border + 9.5 root + (2 x 4) input + 19.5 line, rounded.
    '& .MuiInputBase-sizeSmall.MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
      paddingBlock: '4px !important'
    },
    '& .MuiInputBase-sizeSmall.MuiAutocomplete-inputRoot.Mui-focused .MuiAutocomplete-input': {
      paddingBlock: '4.5px !important'
    },
    '& :not(.MuiInputBase-sizeSmall).MuiAutocomplete-inputRoot': {
      paddingBlock: '2px',
      '& .MuiAutocomplete-input': {
        paddingInline: '8px !important',
        paddingBlock: '5.25px !important'
      },
      '&.Mui-focused': { paddingBlock: '1px' }
    }
  }
}))

const CustomTextField = forwardRef((props: TextFieldProps, ref) => {
  const { size = 'small', slotProps, ...rest } = props

  return (
    <TextFieldStyled
      size={size}
      inputRef={ref}
      {...rest}
      variant='filled'
      slotProps={{
        ...slotProps,
        inputLabel: { ...slotProps?.inputLabel, shrink: true } as InputLabelProps
      }}
    />
  )
})

export default CustomTextField

