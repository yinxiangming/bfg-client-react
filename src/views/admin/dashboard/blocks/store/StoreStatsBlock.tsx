'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Box, CircularProgress, Alert, TextField } from '@mui/material'
import { Icon } from '@iconify/react'
import { getDashboardStats } from '@/services/store'
import type { BlockDefinition, BlockProps, BlockSettingsProps } from '@/views/common/blocks'

export const definition: BlockDefinition = {
  type: 'store_stats',
  name: 'Store Stats',
  category: 'store',
  description: 'Key store metrics: orders, revenue, customers',
  settingsSchema: {
    title: { type: 'string', label: 'Title', description: 'Optional heading above the stats' },
  },
  defaultSettings: { title: '' },
  defaultData: {},
}

interface StoreStatsSettingsProps extends BlockSettingsProps<{ title?: string }, Record<string, unknown>> {}

export function StoreStatsBlockSettings({ settings, onSettingsChange }: StoreStatsSettingsProps) {
  return (
    <TextField
      fullWidth
      size="small"
      label="Title"
      placeholder="Optional heading above the stats"
      value={settings?.title ?? ''}
      onChange={(e) => onSettingsChange({ ...settings, title: e.target.value })}
    />
  )
}

interface StoreStatsBlockProps extends BlockProps<Record<string, unknown>, Record<string, unknown>> {}

export function StoreStatsBlock({ block, settings, data, resolvedData }: StoreStatsBlockProps) {
  const title = (settings?.title as string) ?? ''
  const [stats, setStats] = useState<{
    orders_today: number
    revenue_today: number
    customers_count: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getDashboardStats()
      .then((res) => {
        if (!cancelled) {
          setStats({
            orders_today: res.orders_today,
            revenue_today: res.revenue_today,
            customers_count: res.customers_count,
          })
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  const ordersToday = stats?.orders_today ?? 0
  const revenueToday = stats?.revenue_today ?? 0
  const customers = stats?.customers_count ?? 0

  const items = [
    { label: 'Orders Today', value: ordersToday, icon: 'mdi:cart-outline', color: '#6366f1' },
    { label: 'Revenue Today', value: `$${Number(revenueToday).toLocaleString()}`, icon: 'mdi:currency-usd', color: '#22c55e' },
    { label: 'Total Customers', value: customers, icon: 'mdi:account-group', color: '#f59e0b' },
  ]

  return (
    <Box>
      {title ? (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {title}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <Card key={item.label} variant="outlined" sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Icon icon={item.icon} style={{ color: item.color, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={600}>
              {item.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
      </Box>
    </Box>
  )
}

