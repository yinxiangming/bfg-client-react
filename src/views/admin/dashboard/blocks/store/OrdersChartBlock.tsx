'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box, MenuItem } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dynamic from 'next/dynamic'
import { getDashboardStats } from '@/services/store'
import type { BlockDefinition, BlockProps, BlockSettingsProps } from '@/views/common/blocks'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const CHART_DAYS_OPTIONS = [7, 14, 30] as const

export const definition: BlockDefinition = {
  type: 'store_orders_chart',
  name: 'Orders Chart',
  category: 'store',
  description: 'Order volume over the last 7 days',
  settingsSchema: {
    title: { type: 'string', label: 'Title' },
    days: { type: 'integer', label: 'Days', description: 'Number of days to show (API currently returns 7)' },
  },
  defaultSettings: { title: 'Orders (Last 7 Days)', days: 7 },
  defaultData: {},
}

interface OrdersChartBlockProps extends BlockProps<Record<string, unknown>, Record<string, unknown>> {}

interface OrdersChartSettingsProps extends BlockSettingsProps<{ title?: string; days?: number }, Record<string, unknown>> {}

export function OrdersChartBlockSettings({ settings, onSettingsChange }: OrdersChartSettingsProps) {
  const title = settings?.title ?? definition.defaultSettings?.title ?? ''
  const days = settings?.days ?? 7
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CustomTextField
        fullWidth
        size="small"
        label="Title"
        value={title}
        onChange={(e) => onSettingsChange({ ...settings, title: e.target.value })}
      />
      <CustomTextField
        select
        fullWidth
        size="small"
        label="Days"
        value={days}
        onChange={(e) => onSettingsChange({ ...settings, days: Number(e.target.value) })}
      >
        {CHART_DAYS_OPTIONS.map((d) => (
          <MenuItem key={d} value={d}>
            Last {d} days
          </MenuItem>
        ))}
      </CustomTextField>
    </Box>
  )
}

export function OrdersChartBlock({ block, settings }: OrdersChartBlockProps) {
  const theme = useTheme()
  const chartTitle = (settings?.title as string) ?? definition.defaultSettings?.title ?? 'Orders (Last 7 Days)'
  const [data, setData] = useState<{ orders_last_7_days: number[]; categories: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getDashboardStats()
      .then((res) => {
        if (!cancelled) {
          setData({
            orders_last_7_days: res.orders_last_7_days,
            categories: res.categories,
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

  const series = useMemo(
    () => (data ? [{ name: 'Orders', data: data.orders_last_7_days }] : [{ name: 'Orders', data: [] }]),
    [data]
  )
  const categories = data?.categories ?? []

  const chartOptions = useMemo(
    () => ({
      chart: { type: 'area' as const, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' as const, width: 2 },
      xaxis: { categories },
      fill: { type: 'gradient' as const, gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
      // Series colour follows the active skin's accent, not a fixed hex.
      colors: [theme.palette.primary.main],
      tooltip: {
        theme: 'light',
        cssClass: 'dashboard-chart-tooltip',
        style: { fontSize: '12px' },
        x: { show: true },
        y: { formatter: (val: number) => (val != null ? String(val) : '') },
      },
    }),
    [categories, theme.palette.primary.main]
  )

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography sx={{ mb: 4, fontSize: '0.9375rem', fontWeight: 600 }}>{chartTitle}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        </CardContent>
      </Card>
    )
  }
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography sx={{ mb: 4, fontSize: '0.9375rem', fontWeight: 600 }}>
          {chartTitle}
        </Typography>
        {typeof window !== 'undefined' && ReactApexChart && (
          <ReactApexChart
            type="area"
            height={280}
            options={chartOptions}
            series={series}
          />
        )}
      </CardContent>
    </Card>
  )
}

