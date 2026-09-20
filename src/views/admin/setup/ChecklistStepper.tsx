'use client'

/**
 * The checklist itself.
 *
 * Every row is either something the wizard already did, something only a human
 * can supply (card keys, a real postal address), or something they have chosen
 * to skip. All three are visible: a row that quietly disappears when skipped is
 * how people end up launching without a returns policy.
 *
 * Steps render as expandable panels rather than a linear MUI `Stepper`, because
 * the order is advisory — someone who already has products should be able to go
 * straight to payments without walking through catalogue first.
 */

import { useState } from 'react'

import Link from 'next/link'

import { useLocale, useTranslations } from 'next-intl'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { getTargetSlot, type PageSlotExtension } from '@/extensions/registry'
import { localised, setItemSkipped, type ChecklistItem, type ChecklistStep, type OnboardingStatus } from '@/services/onboarding'

type ChecklistStepperProps = {
  status: OnboardingStatus
  onChange: (status: OnboardingStatus) => void
  /** Plugin panels targeting `SetupStep:<stepKey>`; mounted under that step's rows. */
  stepSlots?: PageSlotExtension[]
}

/** `SetupStep:launch` → the slot id a plugin targets to sit inside that step. */
export const stepSlotId = (stepKey: string) => `SetupStep:${stepKey}`

/**
 * How far a step's rows are inset from the panel edge.
 *
 * AccordionSummary's own padding (16) + the step icon (22) + the gap after it
 * (24). Rows therefore hang under the step *title*, not under its icon, and the
 * hairline rail at that x makes the containment explicit — without it the rows
 * sat at almost the same x as the step heading and read as siblings of it.
 */
const STEP_INDENT = 62

const statusIcon = (item: ChecklistItem) => {
  if (item.done) return { icon: 'tabler-circle-check-filled', color: 'success.main' }
  if (item.skipped) return { icon: 'tabler-circle-minus', color: 'text.disabled' }
  if (item.required) return { icon: 'tabler-circle', color: 'warning.main' }

  return { icon: 'tabler-circle-dashed', color: 'text.disabled' }
}

const ChecklistRow = ({
  item,
  onChange
}: {
  item: ChecklistItem
  onChange: (status: OnboardingStatus) => void
}) => {
  const t = useTranslations('admin.setup')
  const locale = useLocale()
  const [busy, setBusy] = useState(false)
  const { icon, color } = statusIcon(item)

  const toggleSkip = async () => {
    setBusy(true)

    try {
      onChange(await setItemSkipped(item.key, !item.skipped))
    } finally {
      setBusy(false)
    }
  }

  const hint = localised(item, 'hint', locale)
  const value = localised(item, 'value', locale)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 3,
        py: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 }
      }}
    >
      <Box component='i' className={icon} sx={{ color, fontSize: 20, mt: '2px', flexShrink: 0 }} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* `component='div'`: a Chip renders a div, and body2's default <p>
            cannot legally contain one. */}
        <Typography
          component='div'
          variant='body2'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontWeight: 500,
            textDecoration: item.skipped && !item.done ? 'line-through' : 'none',
            color: item.skipped && !item.done ? 'text.disabled' : 'text.primary'
          }}
        >
          {localised(item, 'label', locale)}
          {!item.required && <Chip size='small' variant='tonal' label={t('optional')} sx={{ height: 20 }} />}
        </Typography>
        {/* The configured value, so the row answers "set to what?" without a
            trip to the settings page. `title` because a gateway list or a
            postal address will not fit on one line. */}
        {value && (
          <Typography
            variant='body2'
            color='text.secondary'
            title={value}
            sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {value}
          </Typography>
        )}
        {/* The hint says what to do next, so it is only noise once the row is green. */}
        {hint && !item.done && (
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
            {hint}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
        {!item.done && (
          <Tooltip title={item.skipped ? t('unskipHint') : t('skipHint')}>
            <span>
              <Button size='small' color='secondary' onClick={toggleSkip} disabled={busy}>
                {item.skipped ? t('unskip') : t('skip')}
              </Button>
            </span>
          </Tooltip>
        )}
        <Button
          size='small'
          variant={item.done ? 'text' : 'tonal'}
          component={Link}
          href={item.href}
          endIcon={<i className='tabler-arrow-right' />}
        >
          {item.done ? t('review') : t('go')}
        </Button>
      </Box>
    </Box>
  )
}

const StepPanel = ({
  step,
  expanded,
  onToggle,
  onChange,
  slots
}: {
  step: ChecklistStep
  expanded: boolean
  onToggle: () => void
  onChange: (status: OnboardingStatus) => void
  slots: PageSlotExtension[]
}) => {
  const t = useTranslations('admin.setup')
  const locale = useLocale()

  return (
    <Accordion expanded={expanded} onChange={onToggle} disableGutters>
      <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%', pr: 3 }}>
          <Box
            component='i'
            className={step.complete ? 'tabler-circle-check-filled' : step.icon}
            sx={{ fontSize: 22, color: step.complete ? 'success.main' : 'text.secondary', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {localised(step, 'title', locale)}
            </Typography>
            {/* Once a step has values they are more use than the blurb that
                explains what the step is for. */}
            <Typography variant='caption' color='text.secondary'>
              {localised(step, 'summary', locale) || localised(step, 'description', locale)}
            </Typography>
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>
            {t('stepCount', { done: step.done_count, total: step.total_count })}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2, px: 0 }}>
        <Box
          sx={{
            // The full inset is worth ~90px of a phone's width, so narrow
            // screens get the rail without the alignment.
            ml: { xs: 4, sm: `${STEP_INDENT}px` },
            mr: 4,
            pl: 3,
            borderLeft: '1px solid',
            borderColor: 'divider'
          }}
        >
          {step.items.map(item => (
            <ChecklistRow key={item.key} item={item} onChange={onChange} />
          ))}
        {/* A plugin's own controls — "connect TradeMe" belongs next to the row
            that says it is not connected, not in a separate section. */}
          {slots.map(
            ext =>
              ext.component && (
                <Box key={ext.id} sx={{ pt: 4 }}>
                  <ext.component step={step} status={undefined} onChange={onChange} />
                </Box>
              )
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

const ChecklistStepper = ({ status, onChange, stepSlots = [] }: ChecklistStepperProps) => {
  // Open the first step that still has work in it: landing on a page of
  // collapsed panels hides the one thing the user came here to do.
  const firstIncomplete = status.steps.find(step => !step.complete)?.key ?? status.steps[0]?.key ?? ''
  const [expanded, setExpanded] = useState<string>(firstIncomplete)

  return (
    <Box>
      <LinearProgress variant='determinate' value={status.percent} sx={{ mb: 4, height: 6, borderRadius: 3 }} />
      {status.steps.map(step => (
        <StepPanel
          key={step.key}
          step={step}
          expanded={expanded === step.key}
          onToggle={() => setExpanded(current => (current === step.key ? '' : step.key))}
          onChange={onChange}
          slots={stepSlots.filter(ext => getTargetSlot(ext) === stepSlotId(step.key))}
        />
      ))}
    </Box>
  )
}

export default ChecklistStepper
