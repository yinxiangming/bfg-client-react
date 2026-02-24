'use client'

import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

const RELATION_KEYS = [
  'greater_than',
  'less_than',
  'equals',
  'greater_than_or_equal',
  'less_than_or_equal',
  'not_equals',
  'contains'
] as const

export interface CategoryRuleRow {
  column: string
  relation: string
  condition: string
}

function parseRulesValue(value: unknown): CategoryRuleRow[] {
  if (value == null || value === '') return []
  if (Array.isArray(value)) {
    return value.map((item: any) => ({
      column: typeof item?.column === 'string' ? item.column : '',
      relation: typeof item?.relation === 'string' ? item.relation : 'equals',
      condition: item?.condition != null ? String(item.condition) : ''
    }))
  }
  if (typeof value === 'string') {
    const raw = value.trim() || '[]'
    try {
      const parsed = JSON.parse(raw)
      return parseRulesValue(parsed)
    } catch {
      return []
    }
  }
  return []
}

type CategoryRulesEditorProps = {
  value: unknown
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function CategoryRulesEditor({ value, onChange, error, disabled }: CategoryRulesEditorProps) {
  const t = useTranslations('admin')
  const rules = parseRulesValue(value)

  const updateRule = (index: number, field: keyof CategoryRuleRow, fieldValue: string) => {
    const next = [...rules]
    if (!next[index]) next[index] = { column: '', relation: 'equals', condition: '' }
    next[index] = { ...next[index], [field]: fieldValue }
    onChange(JSON.stringify(next, null, 2))
  }

  const addRule = () => {
    const next = [...rules, { column: '', relation: 'equals', condition: '' }]
    onChange(JSON.stringify(next, null, 2))
  }

  const removeRule = (index: number) => {
    const next = rules.filter((_, i) => i !== index)
    onChange(JSON.stringify(next, null, 2))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rules.map((rule, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: 'action.hover'
          }}
        >
          <TextField
            size='small'
            label={t('categories.editPage.config.rulesEditor.column')}
            placeholder={t('categories.editPage.config.rulesEditor.columnPlaceholder')}
            value={rule.column}
            onChange={e => updateRule(index, 'column', e.target.value)}
            disabled={disabled}
            sx={{ minWidth: 140 }}
          />
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel id={`rules-relation-${index}`}>
              {t('categories.editPage.config.rulesEditor.relation')}
            </InputLabel>
            <Select
              labelId={`rules-relation-${index}`}
              label={t('categories.editPage.config.rulesEditor.relation')}
              value={rule.relation}
              onChange={e => updateRule(index, 'relation', e.target.value)}
              disabled={disabled}
            >
              {RELATION_KEYS.map(key => (
                <MenuItem key={key} value={key}>
                  {t(`categories.editPage.config.relationOptions.${key}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size='small'
            label={t('categories.editPage.config.rulesEditor.condition')}
            placeholder={t('categories.editPage.config.rulesEditor.conditionPlaceholder')}
            value={rule.condition}
            onChange={e => updateRule(index, 'condition', e.target.value)}
            disabled={disabled}
            sx={{ minWidth: 120 }}
          />
          <IconButton
            size='small'
            onClick={() => removeRule(index)}
            disabled={disabled}
            aria-label={t('categories.editPage.config.rulesEditor.removeRule')}
            sx={{ mt: 0.5 }}
          >
            <i className='tabler-trash' style={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}
      {error && (
        <Box component='span' sx={{ color: 'error.main', typography: 'caption' }}>
          {error}
        </Box>
      )}
      <Button
        variant='outlined'
        size='small'
        onClick={addRule}
        disabled={disabled}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('categories.editPage.config.rulesEditor.addRule')}
      </Button>
    </Box>
  )
}
