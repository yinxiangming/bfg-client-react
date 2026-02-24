'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'

type ConfirmOptions = {
  title?: string
  confirmText?: string
  cancelText?: string
  /**
   * When true, the confirm button uses error color.
   * Useful for destructive actions like delete.
   */
  danger?: boolean
}

type AlertOptions = {
  title?: string
  okText?: string
}

type AppDialogApi = {
  alert: (message: string, options?: AlertOptions) => void
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>
}

const AppDialogContext = createContext<AppDialogApi | null>(null)

type PendingConfirm = {
  message: string
  options?: ConfirmOptions
  resolve: (value: boolean) => void
}

type PendingAlert = {
  message: string
  options?: AlertOptions
}

export const AppDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(null)
  const [alertState, setAlertState] = useState<PendingAlert | null>(null)

  const confirmQueueRef = useRef<PendingConfirm[]>([])
  const alertQueueRef = useRef<PendingAlert[]>([])

  const flushNextConfirm = useCallback(() => {
    const next = confirmQueueRef.current.shift() || null
    setConfirmState(next)
  }, [])

  const flushNextAlert = useCallback(() => {
    const next = alertQueueRef.current.shift() || null
    setAlertState(next)
  }, [])

  const showAlert = useCallback((message: string, options?: AlertOptions) => {
    const req: PendingAlert = { message, options }
    setAlertState(prev => {
      if (prev) {
        alertQueueRef.current.push(req)
        return prev
      }

      return req
    })
  }, [])

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      const req: PendingConfirm = { message, options, resolve }

      setConfirmState(prev => {
        if (prev) {
          confirmQueueRef.current.push(req)
          return prev
        }

        return req
      })
    })
  }, [])

  // Replace the native browser alert with a MUI dialog.
  // Note: confirm() can't be replaced safely because it is synchronous in the browser API.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalAlert = window.alert

    window.alert = (message?: any) => {
      showAlert(message == null ? '' : String(message))
    }

    return () => {
      window.alert = originalAlert
    }
  }, [showAlert])

  const onAlertClose = useCallback(() => {
    setAlertState(null)
    flushNextAlert()
  }, [flushNextAlert])

  const onConfirmCancel = useCallback(() => {
    if (confirmState) confirmState.resolve(false)
    setConfirmState(null)
    flushNextConfirm()
  }, [confirmState, flushNextConfirm])

  const onConfirmOk = useCallback(() => {
    if (confirmState) confirmState.resolve(true)
    setConfirmState(null)
    flushNextConfirm()
  }, [confirmState, flushNextConfirm])

  const api = useMemo<AppDialogApi>(() => {
    return {
      alert: showAlert,
      confirm
    }
  }, [confirm, showAlert])

  return (
    <AppDialogContext.Provider value={api}>
      {children}

      {/* Alert Dialog */}
      <Dialog
        open={Boolean(alertState)}
        onClose={onAlertClose}
        maxWidth='xs'
        fullWidth
        aria-labelledby='app-alert-title'
        aria-describedby='app-alert-description'
      >
        {alertState?.options?.title ? <DialogTitle id='app-alert-title'>{alertState.options.title}</DialogTitle> : null}
        <DialogContent>
          <DialogContentText id='app-alert-description' sx={{ whiteSpace: 'pre-wrap' }}>
            {alertState?.message || ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onAlertClose} variant='contained'>
            {alertState?.options?.okText || 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        open={Boolean(confirmState)}
        onClose={onConfirmCancel}
        maxWidth='xs'
        fullWidth
        aria-labelledby='app-confirm-title'
        aria-describedby='app-confirm-description'
      >
        {confirmState?.options?.title ? (
          <DialogTitle id='app-confirm-title'>{confirmState.options.title}</DialogTitle>
        ) : null}
        <DialogContent>
          <DialogContentText id='app-confirm-description' sx={{ whiteSpace: 'pre-wrap' }}>
            {confirmState?.message || ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onConfirmCancel}>{confirmState?.options?.cancelText || 'Cancel'}</Button>
          <Button onClick={onConfirmOk} variant='contained' color={confirmState?.options?.danger ? 'error' : 'primary'}>
            {confirmState?.options?.confirmText || 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppDialogContext.Provider>
  )
}

export const useAppDialog = () => {
  const ctx = useContext(AppDialogContext)
  if (!ctx) throw new Error('useAppDialog must be used within AppDialogProvider')
  return ctx
}

