'use client'

/**
 * Settling one platform invoice.
 *
 * Which gateway takes the money is not the payer's choice — a workspace cannot read the
 * platform's gateways, so the server picks one and names it — and this opens on whatever
 * came back. The gateway's own `type` decides what the payer has to do next:
 *
 *  - a card gateway hands back a client secret, and the card is taken here through the
 *    same Stripe Elements the storefront's checkout confirms with;
 *  - an offline gateway publishes where to send the money, and there is nothing to do on
 *    this page but read it;
 *  - anything else shows what that gateway published, and says plainly that the rest
 *    happens elsewhere. Guessing at a gateway nobody wrote a flow for is exactly how a
 *    payer ends up believing they have paid.
 *
 * In every one of those the payment comes back pending, and the invoice does not move
 * until someone else confirms it: the gateway calling back for a card, a person
 * reconciling the bank for a transfer. Saying so is most of this dialog's job — a reader
 * who closes it thinking the bill is settled has been misled by it.
 */

import { useMemo, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useTheme } from '@/contexts/ThemeContext'
import {
  formatMoney,
  gatewayText,
  type ConsoleInvoice,
  type ConsolePayInvoiceResult,
  type ConsolePaymentGateway
} from '@/services/console'

import { formatDay } from './billingPeriods'

/** How far the request to open a payment has got. */
export type PayAttempt =
  | { kind: 'opening' }
  | { kind: 'refused'; message: string; retryable: boolean }
  | { kind: 'opened'; result: ConsolePayInvoiceResult }

/** The gateway that is settled here, by taking a card. */
const CARD_TYPE = 'stripe'

/** The gateways settled away from this page, by a person moving money. */
const OFFLINE_TYPES = ['bank_transfer', 'pay_in_store', 'custom']

/** The published parameters this page has wording for, in the order a payer reads them. */
const DETAIL_FIELDS = [
  'bank_name',
  'account_name',
  'account_number',
  'routing_number',
  'swift_code',
  'accepted_methods'
] as const

/** Everything above, plus the free-text note, which is laid out on its own. */
const NAMED_FIELDS: ReadonlySet<string> = new Set<string>([...DETAIL_FIELDS, 'instructions'])

/**
 * What the payer has to do, from the gateway the server chose.
 *
 * A card gateway that arrived without the two things a card needs cannot take one, so it
 * is read as a gateway this page does not know: showing a dead card form would be worse
 * than showing what it did publish and saying the rest happens elsewhere.
 */
function payerRoute(result: ConsolePayInvoiceResult): 'card' | 'offline' | 'unknown' {
  const { gateway, gateway_payload } = result

  if (
    gateway.type === CARD_TYPE &&
    gatewayText(gateway.instructions, 'publishable_key') &&
    gatewayText(gateway_payload, 'client_secret')
  ) {
    return 'card'
  }

  return OFFLINE_TYPES.includes(gateway.type) ? 'offline' : 'unknown'
}

/**
 * The card field's own styling, which lives in an iframe of Stripe's.
 *
 * Colours have to be resolved to real ones here: this theme publishes its palette as CSS
 * variables, and `var(--mui-palette-text-primary)` means nothing inside that frame.
 */
function cardFieldOptions(dark: boolean) {
  return {
    hidePostalCode: true,
    style: {
      base: {
        color: dark ? '#e5e7eb' : '#2f2b3d',
        fontFamily: '"Public Sans", "Inter", "Helvetica", "Arial", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '15px',
        '::placeholder': { color: dark ? '#8c8ca1' : '#a5a3ae' }
      },
      invalid: { color: '#ff4d49', iconColor: '#ff4d49' }
    }
  }
}

const mutedSx = { color: 'var(--at-row-sub)' }

/** The bill, its workspace and what is being paid on it, above whatever comes next. */
function InvoiceSummary({
  workspaceName,
  number,
  amount,
  currency,
  dueDate
}: {
  workspaceName: string
  number: string
  amount: string
  currency: string
  dueDate: string | null
}) {
  const t = useTranslations('admin.console.bills')
  const locale = useLocale()
  const due = formatDay(dueDate, locale)

  return (
    <Box sx={{ display: 'grid', gap: 1, fontSize: 13, color: 'var(--at-row-fg)' }}>
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
        <Box sx={mutedSx}>{t('columns.workspace')}</Box>
        <Box>{workspaceName}</Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
        <Box sx={mutedSx}>{t('number', { number })}</Box>
        <Box sx={{ fontWeight: 600 }}>{formatMoney(amount, currency)}</Box>
      </Box>
      {due && (
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
          <Box sx={mutedSx}>{t('columns.due')}</Box>
          <Box>{due}</Box>
        </Box>
      )}
    </Box>
  )
}

/** Everything the gateway published for whoever is paying. */
function GatewayInstructions({
  gateway,
  showUnnamed
}: {
  gateway: ConsolePaymentGateway
  /** Print what this page has no wording for too, rather than guess it away. */
  showUnnamed: boolean
}) {
  const t = useTranslations('admin.console.bills')

  const named = DETAIL_FIELDS.map(field => [t(`pay.fields.${field}`), gatewayText(gateway.instructions, field)])
  const unnamed = showUnnamed
    ? Object.keys(gateway.instructions)
        .filter(key => !NAMED_FIELDS.has(key))
        .map(key => [key, gatewayText(gateway.instructions, key)])
    : []

  const rows = [...named, ...unnamed].filter(([, value]) => value !== '')
  const note = gatewayText(gateway.instructions, 'instructions')

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography component='h3' sx={{ fontSize: 13, fontWeight: 600 }}>
        {t('pay.instructions.title')}
      </Typography>

      {rows.length === 0 && !note ? (
        <Typography sx={{ fontSize: 13, ...mutedSx }}>{t('pay.instructions.none')}</Typography>
      ) : (
        <>
          {rows.length > 0 && (
            <Box sx={{ display: 'grid', gap: 1, fontSize: 13, color: 'var(--at-row-fg)' }}>
              {rows.map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                  <Box sx={mutedSx}>{label}</Box>
                  <Box sx={{ textAlign: 'right', wordBreak: 'break-word' }}>{value}</Box>
                </Box>
              ))}
            </Box>
          )}

          {note && (
            <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--at-row-fg)' }}>{note}</Typography>
          )}
        </>
      )}
    </Box>
  )
}

/**
 * Taking the card, through the client secret the gateway sent back.
 *
 * Stripe's own refusals are shown as Stripe wrote them: it says which of expiry, number
 * or funds was wrong, in the cardholder's language, and anything written here would be
 * vaguer than that. Whatever it answers, the confirmation the invoice waits on is the
 * gateway's call back to the platform, not this reply.
 */
function CardStep({
  result,
  summary,
  onBusy,
  onClose,
  onConfirmed
}: {
  result: ConsolePayInvoiceResult
  summary: React.ReactNode
  /** Held while the card is with the gateway, so the dialog cannot be dismissed over it. */
  onBusy: (busy: boolean) => void
  onClose: () => void
  onConfirmed: () => void
}) {
  const t = useTranslations('admin.console.bills')
  const tActions = useTranslations('admin.common.actions')
  const { systemMode } = useTheme()
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [handed, setHanded] = useState<'charged' | 'inFlight' | null>(null)

  const { payment } = result
  const fieldOptions = useMemo(() => cardFieldOptions(systemMode === 'dark'), [systemMode])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (confirming || handed) return

    const card = elements?.getElement(CardElement)

    if (!stripe || !card) {
      setFailure(t('pay.card.notReady'))

      return
    }

    setConfirming(true)
    onBusy(true)
    setFailure(null)

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        gatewayText(result.gateway_payload, 'client_secret'),
        { payment_method: { card, billing_details: name.trim() ? { name: name.trim() } : undefined } }
      )

      if (error) {
        setFailure(error.message || t('pay.card.failed'))

        return
      }

      setHanded(paymentIntent?.status === 'succeeded' ? 'charged' : 'inFlight')

      // The bill's own state is the platform's to change, and it changes on the gateway's
      // call back rather than on this answer — but the list is worth reading again either
      // way, because that call may already have arrived.
      onConfirmed()
    } catch {
      setFailure(t('pay.card.failed'))
    } finally {
      setConfirming(false)
      onBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
          {summary}

          <Alert severity='info'>
            <AlertTitle>{t('pay.pendingTitle')}</AlertTitle>
            {t('pay.pending.card', { number: payment.number })}
          </Alert>

          {failure && <Alert severity='error'>{failure}</Alert>}

          {handed ? (
            <Alert severity={handed === 'charged' ? 'success' : 'info'}>{t(`pay.card.${handed}`)}</Alert>
          ) : (
            <>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Typography component='label' htmlFor='pay-bill-card' sx={{ fontSize: 13, ...mutedSx }}>
                  {t('pay.card.details')}
                </Typography>
                <Box
                  sx={{
                    border: '1px solid var(--mui-palette-divider)',
                    borderRadius: 1,
                    px: 3,
                    py: 3,
                    '&:focus-within': { borderColor: 'primary.main' }
                  }}
                >
                  <CardElement id='pay-bill-card' options={fieldOptions} />
                </Box>
              </Box>

              <TextField
                fullWidth
                size='small'
                label={t('pay.card.name')}
                value={name}
                disabled={confirming}
                onChange={event => setName(event.target.value)}
              />

              <Typography variant='caption' sx={mutedSx}>
                {t('pay.card.secure')}
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' disabled={confirming} onClick={onClose}>
          {handed ? tActions('close') : tActions('cancel')}
        </Button>
        {!handed && (
          <Button
            type='submit'
            variant='contained'
            disabled={confirming}
            startIcon={confirming ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {t('pay.card.submit', { amount: formatMoney(payment.amount, payment.currency) })}
          </Button>
        )}
      </DialogActions>
    </form>
  )
}

type Props = {
  open: boolean
  workspaceName: string
  invoice: ConsoleInvoice
  attempt: PayAttempt
  onRetry: () => void
  onClose: () => void
  /** The gateway has taken the card, so the list is worth reading again. */
  onConfirmed: () => void
}

export default function PayBillDialog({
  open,
  workspaceName,
  invoice,
  attempt,
  onRetry,
  onClose,
  onConfirmed
}: Props) {
  const t = useTranslations('admin.console.bills')
  const tActions = useTranslations('admin.common.actions')
  const [cardBusy, setCardBusy] = useState(false)

  const result = attempt.kind === 'opened' ? attempt.result : null
  const route = result ? payerRoute(result) : null

  // Stripe is loaded from the key the gateway published, and only once per key: a fresh
  // promise on every render would tear the card field down and build it again under the
  // reader's cursor.
  const publishableKey =
    result && route === 'card' ? gatewayText(result.gateway.instructions, 'publishable_key') : ''
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey])

  const summary = (
    <InvoiceSummary
      workspaceName={workspaceName}
      number={invoice.number}
      amount={result ? result.payment.amount : invoice.total}
      currency={result ? result.payment.currency : invoice.currency}
      dueDate={result ? result.invoice.due_date : invoice.due_date}
    />
  )

  const opening = attempt.kind === 'opening'

  return (
    // Dismissing the dialog over a request that is already with the server, or a card
    // that is already with the gateway, would hide an answer nobody can ask for again.
    <Dialog open={open} fullWidth maxWidth='sm' onClose={opening || cardBusy ? undefined : onClose}>
      <DialogTitle>{t('pay.title', { number: invoice.number })}</DialogTitle>

      {result && route === 'card' && stripePromise ? (
        <Elements stripe={stripePromise}>
          <CardStep
            result={result}
            summary={summary}
            onBusy={setCardBusy}
            onClose={onClose}
            onConfirmed={onConfirmed}
          />
        </Elements>
      ) : (
        <>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
              {summary}

              {opening && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
                  <CircularProgress size={18} />
                  <Typography sx={{ fontSize: 13, ...mutedSx }}>{t('pay.opening')}</Typography>
                </Box>
              )}

              {attempt.kind === 'refused' && <Alert severity='error'>{attempt.message}</Alert>}

              {result && route !== 'card' && (
                <>
                  <Alert severity='info'>
                    <AlertTitle>{t('pay.pendingTitle')}</AlertTitle>
                    {t(`pay.pending.${route}`, { number: result.payment.number })}
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between', fontSize: 13 }}>
                    <Box sx={mutedSx}>{t('pay.gateway')}</Box>
                    <Box sx={{ color: 'var(--at-row-fg)' }}>{result.gateway.name}</Box>
                  </Box>

                  <GatewayInstructions gateway={result.gateway} showUnnamed={route === 'unknown'} />

                  {route === 'offline' ? (
                    <Typography variant='caption' sx={mutedSx}>
                      {t('pay.reference', { number: result.invoice.number })}
                    </Typography>
                  ) : (
                    <Typography variant='caption' sx={mutedSx}>
                      {t('pay.unknownNote')}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button color='secondary' disabled={opening} onClick={onClose}>
              {tActions('close')}
            </Button>
            {attempt.kind === 'refused' && attempt.retryable && (
              <Button variant='contained' onClick={onRetry}>
                {tActions('retry')}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
