'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, Typography, CircularProgress, Alert, Box, TextField, MenuItem } from '@mui/material'
import dynamic from 'next/dynamic'
import { getBookings } from '@/services/webBooking'
import type { BlockRegistryEntry, BlockDefinition, BlockProps, BlockSettingsProps } from '@/views/common/blocks'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const CHART_DAYS_OPTIONS = [7, 14, 30] as const

const definition: BlockDefinition = {
  type: 'resale_bookings_chart',
  name: 'Resale Bookings',
  category: 'resale',
  description: 'Resale bookings over last 7 days',
  settingsSchema: {
    title: { type: 'string', label: 'Title' },
    days: { type: 'integer', label: 'Days' },
  },
  defaultSettings: { title: 'Resale Bookings (Last 7 Days)', days: 7 },
  defaultData: {},
}

function lastNDaysLabelsAndData(days: number): { categories: string[]; data: number[] } {
  const categories: string[] = []
  const data: number[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    categories.push(d.toLocaleDateString('en-US', { weekday: 'short' }))
    data.push(0)
  }
  return { categories, data }
}

interface ResaleBookingsSettingsProps extends BlockSettingsProps<{ title?: string; days?: number }, Record<string, unknown>> {}

export function ResaleBookingsChartSettings({ settings, onSettingsChange }: ResaleBookingsSettingsProps) {
  const title = settings?.title ?? definition.defaultSettings?.title ?? ''
  const days = settings?.days ?? 7
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        size="small"
        label="Title"
        value={title}
        onChange={(e) => onSettingsChange({ ...settings, title: e.target.value })}
      />
      <TextField
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
      </TextField>
    </Box>
  )
}

function ResaleBookingsChartComponent({
  block,
  settings,
}: BlockProps<{ title?: string; days?: number }, Record<string, unknown>>) {
  const days = (settings?.days as number) ?? 7
  const [chartData, setChartData] = useState<{ categories: string[]; data: number[] }>(() =>
    lastNDaysLabelsAndData(days)
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const today = new Date()
    const dateTo = today.toISOString().slice(0, 10)
    const dateFrom = new Date(today)
    dateFrom.setDate(dateFrom.getDate() - (days - 1))
    const dateFromStr = dateFrom.toISOString().slice(0, 10)

    getBookings({ date_from: dateFromStr, date_to: dateTo })
      .then((res) => {
        if (cancelled) return
        const results = res.results ?? []
        const { categories, data } = lastNDaysLabelsAndData(days)
        const start = new Date(dateFromStr)
        start.setHours(0, 0, 0, 0)
        for (const b of results) {
          const created = b.created_at ? new Date(b.created_at) : null
          if (!created) continue
          const dayIndex = Math.floor((created.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
          if (dayIndex >= 0 && dayIndex < days) {
            data[dayIndex] = (data[dayIndex] ?? 0) + 1
          }
        }
        setChartData({ categories, data })
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
  }, [days])

  const series = useMemo(
    () => [{ name: 'Bookings', data: chartData.data }],
    [chartData.data]
  )
  const chartOptions = useMemo(
    () => ({
      chart: { type: 'bar' as const, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      dataLabels: { enabled: false },
      xaxis: { categories: chartData.categories },
      colors: ['#8b5cf6'],
      tooltip: {
        theme: 'light',
        cssClass: 'dashboard-chart-tooltip',
        style: { fontSize: '12px' },
        x: { show: true },
        y: { formatter: (val: number) => (val != null ? String(val) : '') },
      },
    }),
    [chartData.categories]
  )

  const chartTitle = (settings?.title as string) ?? definition.defaultSettings?.title ?? 'Resale Bookings (Last 7 Days)'

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>{chartTitle}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        </CardContent>
      </Card>
    )
  }
  if (error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {chartTitle}
        </Typography>
        {typeof window !== 'undefined' && ReactApexChart && (
          <ReactApexChart type="bar" height={280} options={chartOptions} series={series} />
        )}
      </CardContent>
    </Card>
  )
}

export const resaleBookingsChartEntry: BlockRegistryEntry = {
  definition,
  Component: ResaleBookingsChartComponent as any,
  SettingsEditor: ResaleBookingsChartSettings as any,
}
