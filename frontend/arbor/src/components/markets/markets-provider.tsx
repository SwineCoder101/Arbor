'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Market types
export type MarketName = 'drift' | 'mango' | 'zeta' | 'jupiter' | 'orderly'

export interface MarketData {
  name: MarketName
  displayName: string
  status: 'active' | 'inactive' | 'maintenance'
  volumeLast24h: number
  volumeChange: number
  openInterest: number
  openInterestChange: number
  fundingRate: number
  fundingRateAnnualized: number
  nextFundingTime?: string
}

interface MarketsContextValue {
  markets: MarketData[]
  isLoading: boolean
  error: Error | null
}

const MarketsContext = createContext<MarketsContextValue | undefined>(undefined)

export function MarketsProvider({ children }: { children: React.ReactNode }) {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Simulate fetching market data
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true)
        
        // This would typically be an API call
        // Mock data for demonstration purposes
        const mockMarketData: MarketData[] = [
          {
            name: 'drift',
            displayName: 'Drift Protocol',
            status: 'active',
            volumeLast24h: 152431589,
            volumeChange: 12.4,
            openInterest: 28350432,
            openInterestChange: 5.8,
            fundingRate: 0.0023,
            fundingRateAnnualized: 8.42,
            nextFundingTime: '2h 12m',
          },
          {
            name: 'mango',
            displayName: 'Mango Markets',
            status: 'active',
            volumeLast24h: 89245671,
            volumeChange: -2.1,
            openInterest: 14567892,
            openInterestChange: -1.3,
            fundingRate: -0.0012,
            fundingRateAnnualized: -4.38,
            nextFundingTime: '3h 45m',
          },
          {
            name: 'zeta',
            displayName: 'Zeta Markets',
            status: 'active',
            volumeLast24h: 63124578,
            volumeChange: 8.9,
            openInterest: 11982345,
            openInterestChange: 2.7,
            fundingRate: 0.0018,
            fundingRateAnnualized: 6.57,
            nextFundingTime: '1h 30m',
          },
          {
            name: 'jupiter',
            displayName: 'Jupiter Exchange',
            status: 'active',
            volumeLast24h: 246897123,
            volumeChange: 15.3,
            openInterest: 0, // Not applicable for Jupiter
            openInterestChange: 0,
            fundingRate: 0, // Not applicable for Jupiter
            fundingRateAnnualized: 0,
          },
          {
            name: 'orderly',
            displayName: 'Orderly Network',
            status: 'active',
            volumeLast24h: 45678231,
            volumeChange: 6.2,
            openInterest: 8945672,
            openInterestChange: 3.9,
            fundingRate: 0.0015,
            fundingRateAnnualized: 5.48,
            nextFundingTime: '2h 56m',
          },
        ]
        
        setMarkets(mockMarketData)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch markets'))
        setIsLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  return (
    <MarketsContext.Provider value={{ markets, isLoading, error }}>
      {children}
    </MarketsContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketsContext)
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketsProvider')
  }
  return context
}