'use client'

/**
 * A workspace's extensions: what it can switch on, what it has on, and the switches.
 *
 * Extensions are managed here and nowhere else; a workspace's own admin has no page for
 * them. An owner of a suspended or deactivated workspace reads this page without being
 * able to change anything, which is also what the server answers.
 *
 * An add-on is acquired before it is switched on. One that costs nothing is given on the
 * spot and comes back on; one that costs something is billed, and nothing about the
 * extension changes until that bill is paid — so the page shows the bill rather than
 * pretending the extension is now running. Asking twice is billed once.
 *
 * Two priced add-ons do come on straight away, and the page says a bill is still coming:
 * one on a trial the workspace has not had, and one the platform could not bill today.
 * Neither is free, so neither is reported as given.
 */

import { useState } from 'react'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'

import Icon from '@components/Icon'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useAppDialog } from '@/contexts/AppDialogContext'
import { useConsole, useConsoleWorkspace } from '@/contexts/ConsoleContext'
import ConsoleWorkspacePanels from '@/extensions/ConsoleWorkspacePanels'
import {
  acquireExtension,
  activateExtension,
  consoleWorkspaceStatus,
  deactivateExtension,
  extensionName,
  formatMoney,
  getConsoleErrorCode,
  getConsoleErrorKeys,
  needsAcquiring,
  type ConsoleAcquireInvoice,
  type ConsoleExtension
} from '@/services/console'
import { BASE_PLAN_KEY, type ConsoleGrant } from '@/services/consoleAdmin'

import { formatDay, formatMoment, formatMomentDay } from './billingPeriods'
import ExtensionCard from './ExtensionCard'
import GrantEntitlementDialog from './GrantEntitlementDialog'
import { useConsoleWorkspaceDetail } from './useConsoleWorkspaceDetail'
import { useEnterWorkspace } from './useEnterWorkspace'

/** Where the bills for every workspace the account owns are read and settled. */
const BILLS_PATH = '/workspaces/billing'

/** What came of acquiring an add-on, or of granting one, until the reader dismisses it. */
type AcquireNotice =
  | { kind: 'granted'; name: string; on: boolean }
  | { kind: 'invoiced'; name: string; invoice: ConsoleAcquireInvoice }
  | { kind: 'platformGrant'; name: string; grant: ConsoleGrant }
  /** On now, with the bill still to come: `days` is the trial's length, or 0 for none. */
  | { kind: 'billedLater'; name: string; days: number; until: string | null }

export default function WorkspaceExtensionsPage({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.extensions')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const { confirm } = useAppDialog()
  const { state: consoleState } = useConsole()
  const membership = useConsoleWorkspace(workspaceId)
  const { state, reload, replaceExtension } = useConsoleWorkspaceDetail(workspaceId)
  const enter = useEnterWorkspace(workspaceId)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [notice, setNotice] = useState<AcquireNotice | null>(null)
  // Keys the server has said need no acquiring, which is how a wrong guess is put right:
  // `needsAcquiring` cannot tell an add-on the workspace already holds from one it has
  // never had, and a card that only ever offers a button the server refuses is a dead end.
  const [nothingToAcquire, setNothingToAcquire] = useState<string[]>([])
  const [granting, setGranting] = useState(false)

  const isPlatformAdmin = consoleState.kind === 'loaded' && consoleState.isPlatformAdmin
  const workspace = state.kind === 'loaded' ? state.workspace : null
  const status = workspace ? consoleWorkspaceStatus(workspace) : 'active'
  // A platform administrator is held back by neither, exactly as the server has it.
  const readOnlyReason = !isPlatformAdmin && status !== 'active' ? status : null
  const canChange = readOnlyReason === null
  // Switching into a workspace needs active staff there, owners included.
  const canEnter = Boolean(membership?.is_member)

  const open = async (path: string) => {
    setFailure(null)

    if (!(await enter(path))) setFailure(t('enterFailed'))
  }

  /** What a refusal means, with the extensions it names written out. */
  const refusalMessage = (error: unknown, fallback: string): string => {
    const code = getConsoleErrorCode(error)

    if (!code || !t.has(`errors.${code}`)) return fallback

    const named =
      code === 'requires_inactive'
        ? getConsoleErrorKeys(error, 'requires')
        : code === 'required_by_active'
          ? getConsoleErrorKeys(error, 'required_by')
          : []
    const names = named
      .map(key => {
        const other = workspace?.extensions.find(extension => extension.key === key)

        return other ? extensionName(other, locale) : key
      })
      .join(locale.startsWith('zh') ? '、' : ', ')

    return t(`errors.${code}`, { names })
  }

  const change = async (extension: ConsoleExtension, action: 'activate' | 'deactivate') => {
    setBusyKey(extension.key)
    setFailure(null)
    setNotice(null)

    try {
      const updated =
        action === 'activate'
          ? await activateExtension(workspaceId, extension.key)
          : await deactivateExtension(workspaceId, extension.key)

      replaceExtension(updated)
    } catch (error) {
      setFailure(refusalMessage(error, t('failed')))
    } finally {
      setBusyKey(null)
    }
  }

  /** Ask for an add-on: it is either given, or billed. */
  const acquire = async (extension: ConsoleExtension) => {
    setBusyKey(extension.key)
    setFailure(null)
    setNotice(null)

    const name = extensionName(extension, locale)

    try {
      const result = await acquireExtension(workspaceId, extension.key)

      // The answer carries the extension as it now stands either way, which for a billed
      // one is as it was; the card is put straight from it rather than from a guess.
      replaceExtension(result.extension)

      if (result.invoice) {
        // Nothing else was written: the workspace owes for it first.
        setNotice({ kind: 'invoiced', name, invoice: result.invoice })
      } else if (result.trial_days || result.billed_later) {
        // On now, but not free: the period it is on for is billed like any other.
        setNotice({
          kind: 'billedLater',
          name,
          days: result.trial_days ?? 0,
          until: result.entitled_until ?? null
        })
      } else {
        setNotice({ kind: 'granted', name, on: result.extension.status === 'active' })
      }
    } catch (error) {
      const code = getConsoleErrorCode(error)

      // Both say the same thing about the button just pressed: there is nothing to
      // acquire here, so the card offers the switch from now on rather than this again.
      // The page is told what the workspace holds, but it may have been read before
      // someone else acquired this, and a button the server only ever refuses is a dead end.
      if (code === 'already_entitled' || code === 'not_an_addon') {
        setNothingToAcquire(keys => (keys.includes(extension.key) ? keys : [...keys, extension.key]))
      }

      setFailure(refusalMessage(error, t('acquireFailed')))
    } finally {
      setBusyKey(null)
    }
  }

  /**
   * What granting wrote, and the workspace read again from the server.
   *
   * Being entitled is not a field on any card, but what the cards offer follows
   * from it: an add-on the workspace has just been given is no longer one to
   * acquire, and one the platform had paused may now be running.
   */
  const onGranted = (grant: ConsoleGrant) => {
    const { key } = grant.entitlement
    const granted = key === BASE_PLAN_KEY ? null : workspace?.extensions.find(extension => extension.key === key)

    setFailure(null)
    setNotice({
      kind: 'platformGrant',
      // A key no card names is still worth naming, so an extension the deployment
      // has since stopped shipping reads as itself rather than as the plan.
      name: granted ? extensionName(granted, locale) : key || t('grant.basePlan'),
      grant
    })
    setGranting(false)
    void reload()
  }

  const askThenDeactivate = async (extension: ConsoleExtension) => {
    const name = extensionName(extension, locale)
    const confirmed = await confirm(t('confirm.body', { name }), {
      title: t('confirm.title', { name }),
      confirmText: t('deactivate')
    })

    if (confirmed) await change(extension, 'deactivate')
  }

  if (state.kind === 'loading') {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (state.kind === 'failed') {
    return (
      <Alert
        severity='error'
        action={
          !state.notFound && (
            <Button color='inherit' size='small' onClick={() => void reload()}>
              {tActions('retry')}
            </Button>
          )
        }
      >
        {state.notFound ? t('notFound') : t('loadFailed')}
      </Alert>
    )
  }

  const { workspace: loaded } = state

  if (loaded.capabilities?.extension_management !== true) {
    return (
      <>
        <AdminPageHeader title={t('title')} subtitle={`${loaded.name} · ${t('subtitle')}`} />
        <Alert severity='info'>{t('unavailable')}</Alert>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={`${loaded.name} · ${t('subtitle')}`}
        actions={
          // Nothing rather than an empty row of controls: a reader who may
          // neither grant nor enter this workspace gets a plain heading.
          isPlatformAdmin || canEnter ? (
            <>
              {isPlatformAdmin && (
                <Button variant='outlined' startIcon={<Icon icon='tabler-gift' />} onClick={() => setGranting(true)}>
                  {t('grant.action')}
                </Button>
              )}
              {canEnter && (
                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler-login-2' />}
                  onClick={() => void open('/admin')}
                >
                  {t('enter')}
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      {readOnlyReason && (
        <Alert severity='info' sx={{ mb: 4 }}>
          {t(`readOnly.${readOnlyReason}`)}
        </Alert>
      )}

      {failure && (
        <Alert severity='error' sx={{ mb: 4 }} onClose={() => setFailure(null)}>
          {failure}
        </Alert>
      )}

      {notice?.kind === 'granted' && (
        <Alert severity='success' sx={{ mb: 4 }} onClose={() => setNotice(null)}>
          {notice.on ? t('acquired.on', { name: notice.name }) : t('acquired.granted', { name: notice.name })}
        </Alert>
      )}

      {notice?.kind === 'billedLater' && (
        <Alert severity='success' sx={{ mb: 4 }} onClose={() => setNotice(null)}>
          <AlertTitle>
            {notice.days > 0
              ? t('acquired.trialTitle', { name: notice.name, days: notice.days })
              : t('acquired.onBillLaterTitle', { name: notice.name })}
          </AlertTitle>
          {notice.until
            ? t(notice.days > 0 ? 'acquired.trialBody' : 'acquired.onBillLaterBody', {
                until: formatMomentDay(notice.until, locale)
              })
            : t('acquired.billLaterNoEnd')}
          <Box sx={{ mt: 2 }}>
            <Button component={Link} href={BILLS_PATH} size='small' variant='outlined' color='inherit'>
              {t('acquired.viewBills')}
            </Button>
          </Box>
        </Alert>
      )}

      {notice?.kind === 'invoiced' && (
        <Alert severity='info' sx={{ mb: 4 }} onClose={() => setNotice(null)}>
          <AlertTitle>
            {t(notice.invoice.issued ? 'acquired.invoiceTitle' : 'acquired.invoiceUnpaidTitle', {
              name: notice.name
            })}
          </AlertTitle>
          {t(notice.invoice.issued ? 'acquired.invoiceBody' : 'acquired.invoiceUnpaidBody', {
            name: notice.name,
            number: notice.invoice.number,
            total: formatMoney(notice.invoice.total, notice.invoice.currency),
            due: formatDay(notice.invoice.due_date, locale)
          })}
          <Box sx={{ mt: 2 }}>
            <Button component={Link} href={BILLS_PATH} size='small' variant='outlined' color='inherit'>
              {t('acquired.viewBills')}
            </Button>
          </Box>
        </Alert>
      )}

      {notice?.kind === 'platformGrant' && (
        <Alert
          severity={notice.grant.extension?.refusal ? 'warning' : 'success'}
          sx={{ mb: 4 }}
          onClose={() => setNotice(null)}
        >
          <AlertTitle>{t('grant.done', { name: notice.name })}</AlertTitle>
          {notice.grant.entitlement.current_period_end
            ? t('grant.runsUntil', {
                until: formatMoment(notice.grant.entitlement.current_period_end, locale)
              })
            : t('grant.runsForever')}
          {notice.grant.extension?.resumed && ` ${t('grant.resumed')}`}
          {notice.grant.extension?.refusal && ` ${t('grant.notResumed')}`}
        </Alert>
      )}

      {isPlatformAdmin && (
        <GrantEntitlementDialog
          open={granting}
          workspaceId={workspaceId}
          extensions={loaded.extensions}
          onClose={() => setGranting(false)}
          onGranted={onGranted}
        />
      )}

      {loaded.extensions.length === 0 ? (
        <Card sx={{ px: 6, py: 12, textAlign: 'center' }}>
          <Box sx={{ color: 'var(--at-row-sub)' }}>{t('none')}</Box>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }
          }}
        >
          {loaded.extensions.map(extension => (
            <ExtensionCard
              key={extension.key}
              extension={extension}
              canChange={canChange}
              busy={busyKey === extension.key}
              anyBusy={busyKey !== null}
              needsAcquire={needsAcquiring(extension) && !nothingToAcquire.includes(extension.key)}
              onAcquire={() => void acquire(extension)}
              onActivate={() => void change(extension, 'activate')}
              onDeactivate={() => void askThenDeactivate(extension)}
              onSettings={extension.admin_url && canEnter ? () => void open(extension.admin_url) : undefined}
            />
          ))}
        </Box>
      )}

      <ConsoleWorkspacePanels workspaceId={workspaceId} isPlatformAdmin={isPlatformAdmin} />
    </>
  )
}
