'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCarriers, getWarehouses, type Carrier, type Warehouse } from '@/services/shipping'
import { getCurrencies, type Currency } from '@/services/finance'

type BaseDataContextType = {
  carriers: Carrier[]
  warehouses: Warehouse[]
  currencies: Currency[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const BaseDataContext = createContext<BaseDataContextType | undefined>(undefined)

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

// In-memory cache
let cache: {
  carriers?: { data: Carrier[]; timestamp: number }
  warehouses?: { data: Warehouse[]; timestamp: number }
  currencies?: { data: Currency[]; timestamp: number }
} = {}

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION
}

export function BaseDataProvider({ children }: { children: ReactNode }) {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch carriers
      if (forceRefresh || !cache.carriers || !isCacheValid(cache.carriers.timestamp)) {
        const carriersData = await getCarriers()
        cache.carriers = { data: carriersData, timestamp: Date.now() }
        setCarriers(carriersData)
      } else {
        setCarriers(cache.carriers.data)
      }

      // Fetch warehouses
      if (forceRefresh || !cache.warehouses || !isCacheValid(cache.warehouses.timestamp)) {
        const warehousesData = await getWarehouses()
        cache.warehouses = { data: warehousesData, timestamp: Date.now() }
        setWarehouses(warehousesData)
      } else {
        setWarehouses(cache.warehouses.data)
      }

      // Fetch currencies
      if (forceRefresh || !cache.currencies || !isCacheValid(cache.currencies.timestamp)) {
        const currenciesData = await getCurrencies()
        cache.currencies = { data: currenciesData, timestamp: Date.now() }
        setCurrencies(currenciesData)
      } else {
        setCurrencies(cache.currencies.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load base data')
      console.error('Failed to load base data:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchData(true)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <BaseDataContext.Provider
      value={{
        carriers,
        warehouses,
        currencies,
        loading,
        error,
        refresh
      }}
    >
      {children}
    </BaseDataContext.Provider>
  )
}

export function useBaseData() {
  const context = useContext(BaseDataContext)
  if (context === undefined) {
    throw new Error('useBaseData must be used within a BaseDataProvider')
  }
  return context
}
