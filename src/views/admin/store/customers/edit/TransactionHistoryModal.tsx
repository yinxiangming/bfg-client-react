'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Pagination from '@mui/material/Pagination'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Util Imports
import { formatDateTime, formatCurrency } from '@/utils/format'
import { apiFetch, bfgApi } from '@/utils/api'

type Transaction = {
  id: number
  transaction_type: 'payment' | 'refund' | 'credit' | 'debit' | 'adjustment'
  amount: string | number
  currency_code: string
  description: string
  notes?: string
  created_at: string
  created_by_name?: string | null
}

type TransactionHistoryModalProps = {
  open: boolean
  onClose: () => void
  customerId: number
}

const PAGE_SIZE = 10

const TransactionHistoryModal = ({ open, onClose, customerId }: TransactionHistoryModalProps) => {
  const t = useTranslations('admin')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchTransactions = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const response = await apiFetch<{
        count: number
        next: string | null
        previous: string | null
        results: Transaction[]
      }>(`${bfgApi.customers()}${customerId}/wallet/transactions/?page=${pageNum}&page_size=${PAGE_SIZE}`)
      
      setTransactions(response.results || [])
      setTotal(response.count || 0)
    } catch (error) {
      console.error('Failed to fetch transactions', error)
      setTransactions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && customerId) {
      fetchTransactions(page)
    }
  }, [open, customerId, page])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'success'
      case 'debit':
        return 'error'
      case 'payment':
        return 'primary'
      case 'refund':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getTransactionTypeLabel = (type: Transaction['transaction_type']) => {
    const key = `customers.wallet.transactions.types.${type}` as const
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key) : formatTransactionType(type)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5'>{t('customers.wallet.transactions.title')}</Typography>
        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color='text.secondary'>{t('customers.wallet.transactions.empty')}</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('customers.wallet.transactions.table.headers.date')}</TableCell>
                  <TableCell>{t('customers.wallet.transactions.table.headers.type')}</TableCell>
                  <TableCell>{t('customers.wallet.transactions.table.headers.description')}</TableCell>
                  <TableCell>{t('customers.wallet.transactions.table.headers.user')}</TableCell>
                  <TableCell align='right'>{t('customers.wallet.transactions.table.headers.amount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDateTime(transaction.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTransactionTypeLabel(transaction.transaction_type)}
                        color={getTransactionTypeColor(transaction.transaction_type)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{transaction.description}</Typography>
                      {transaction.notes && (
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                          {transaction.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {transaction.created_by_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        color={
                          transaction.transaction_type === 'credit' || transaction.transaction_type === 'refund'
                            ? 'success.main'
                            : 'text.primary'
                        }
                        sx={{ fontWeight: 500 }}
                      >
                        {transaction.transaction_type === 'credit' || transaction.transaction_type === 'refund'
                          ? '+'
                          : '-'}
                        {formatCurrency(Number(transaction.amount), transaction.currency_code)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {total > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(total / PAGE_SIZE)}
              page={page}
              onChange={handlePageChange}
              color='primary'
              shape='rounded'
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('customers.wallet.transactions.actions.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default TransactionHistoryModal
