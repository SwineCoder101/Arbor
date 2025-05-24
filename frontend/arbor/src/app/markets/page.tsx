'use client'

import { useState, useEffect } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tabs, Tab } from '@/components/ui/tabs'
import {
  Search,
  ArrowUpRight,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  InfoIcon,
  FilterIcon,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { StrategyDetailModal } from '@/components/markets/strategy-detail-modal'

interface PerpsData {
  name: string
  marketIndex: number
  publicKey: string
  fundingRate: number
  lastFundingRateTimestamp: number
  twapPrice: number
  dex: string
}

interface CombinedMarketData {
  asset: string
  drift?: PerpsData
  zeta?: PerpsData
  fundingRateDifference?: number
  arbitrageRate?: number
  annualizedArbitrageRate?: number
}

interface DexInfo {
  name: string
  fundingRate: number
  price?: number
}

interface Strategy {
  asset: string
  longDex: DexInfo
  shortDex: DexInfo
  arbitrageRateAnnualized: string
  arbitrageRateDaily: string
  recommendedSize: string
  estimatedDailyProfit: string
  estimatedAnnualProfit: string
  riskAssessment: string
  strategyType: string
  identifiedAt: string
  activeOrders: Array<{
    id: string
    side: string
    dex: string
    size: string
    entryPrice: string
    status: string
    createdAt: string
    wallet: string
    pnl: string
  }>
}

interface DeltaNeutralData {
  deltaNeutralOfferings: Strategy[]
  topArbitrageOpportunities: Strategy[]
}

export default function MarketsPage() {
  const [combinedMarkets, setCombinedMarkets] = useState<CombinedMarketData[]>([])
  const [deltaNeutralStrategies, setDeltaNeutralStrategies] = useState<Strategy[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'annualizedArbitrageRate', direction: 'desc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [strategySearchQuery, setStrategySearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('arbitrage')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch perp data from both DEXes and delta-neutral strategies
        const [driftResponse, zetaResponse, deltaNeutralResponse] = await Promise.all([
          fetch('/drift-perps-json.json'),
          fetch('/zeta-perps-json.json'),
          fetch('/delta-neutral-perp-offerings.json')
        ])
        
        if (!driftResponse.ok || !zetaResponse.ok || !deltaNeutralResponse.ok) {
          throw new Error('Failed to fetch market data')
        }
        
        const driftData: PerpsData[] = await driftResponse.json()
        const zetaData: PerpsData[] = await zetaResponse.json()
        const deltaNeutralData: DeltaNeutralData = await deltaNeutralResponse.json()
        
        setDeltaNeutralStrategies(deltaNeutralData.deltaNeutralOfferings)
        
        // Create combined market data
        const allAssets = [...new Set([
          ...driftData.map(p => p.name),
          ...zetaData.map(p => p.name)
        ])]
        
        const combined = allAssets.map(asset => {
          const driftMarket = driftData.find(p => p.name === asset)
          const zetaMarket = zetaData.find(p => p.name === asset)
          
          let fundingRateDifference = 0
          let arbitrageRate = 0
          let annualizedArbitrageRate = 0
          
          if (driftMarket && zetaMarket) {
            // Convert from basis points to percentage (divisor depends on your data format)
            const driftRate = driftMarket.fundingRate / 10000
            const zetaRate = zetaMarket.fundingRate / 10000
            
            fundingRateDifference = Math.abs(driftRate - zetaRate)
            
            // Daily rate (assuming 3 funding periods per day)
            arbitrageRate = fundingRateDifference * 3
            
            // Annualized (365 days)
            annualizedArbitrageRate = arbitrageRate * 365
          }
          
          return {
            asset,
            drift: driftMarket,
            zeta: zetaMarket,
            fundingRateDifference,
            arbitrageRate,
            annualizedArbitrageRate
          }
        })
        
        setCombinedMarkets(combined)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading market data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  // Filter and sort the market data
  const filteredMarkets = combinedMarkets.filter(market => {
    if (!searchQuery) return true
    return market.asset.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Sort the filtered markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof CombinedMarketData] as number | undefined || 0
    const bValue = b[sortConfig.key as keyof CombinedMarketData] as number | undefined || 0
    
    if (sortConfig.direction === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })

  // Format funding rate to display percentage
  const formatFundingRate = (rate?: number): string => {
    if (rate === undefined) return 'N/A'
    
    // Assuming rate is already in percentage
    const formatted = rate.toFixed(6)
    return rate >= 0 ? `+${formatted}%` : `${formatted}%`
  }

  // Format price to display in USD
  const formatPrice = (price?: number): string => {
    if (price === undefined) return 'N/A'
    
    // Convert from quote decimals (typically 6 for USDC)
    const priceInUsd = price / 1000000
    
    // Format based on size
    if (priceInUsd >= 1000) {
      return `$${(priceInUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    } else if (priceInUsd >= 1) {
      return `$${(priceInUsd).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
    } else {
      return `$${(priceInUsd).toLocaleString(undefined, { maximumFractionDigits: 6 })}`
    }
  }

  // Handle sort when column header is clicked
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  // Determine risk level based on arbitrage rate
  const getRiskLevel = (rate?: number): { level: string; className: string } => {
    if (rate === undefined) return { level: 'Unknown', className: 'bg-slate-100 text-slate-800' }
    
    if (rate >= 0.2) {
      return { level: 'High', className: 'bg-rose-100 text-rose-800' }
    } else if (rate >= 0.1) {
      return { level: 'Medium', className: 'bg-amber-100 text-amber-800' }
    } else {
      return { level: 'Low', className: 'bg-emerald-100 text-emerald-800' }
    }
  }

  // Format timestamp to human-readable date
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return 'N/A'
    
    const date = new Date(timestamp * 1000) // Convert from UNIX timestamp
    return date.toLocaleString()
  }
  
  // Filter delta-neutral strategies based on search query
  const filteredStrategies = deltaNeutralStrategies.filter(strategy => {
    if (!strategySearchQuery) return true
    return (
      strategy.asset.toLowerCase().includes(strategySearchQuery.toLowerCase()) ||
      strategy.strategyType.toLowerCase().includes(strategySearchQuery.toLowerCase()) ||
      strategy.longDex.name.toLowerCase().includes(strategySearchQuery.toLowerCase()) ||
      strategy.shortDex.name.toLowerCase().includes(strategySearchQuery.toLowerCase())
    )
  })
  
  // Get strategy name format: <perp symbol>-<short dex>-<long dex>
  const getStrategyName = (strategy: Strategy): string => {
    return `${strategy.asset}-${strategy.shortDex.name}-${strategy.longDex.name}`
  }
  
  // Calculate position value in USDC
  const calculatePositionValueInUSDC = (strategy: Strategy): string => {
    const size = parseFloat(strategy.recommendedSize)
    const price = strategy.longDex.price || 0
    const totalValue = size * price
    return totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  if (isLoading) {
    return <div className="p-8">Loading market data...</div>
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Heading size="h3" decoration="branch">Markets</Heading>
        <Subheading>Explore funding rate arbitrage opportunities across DEXes</Subheading>
      </div>

      {/* Markets Table */}
      <ArborPanel>
        <ArborPanelHeader>
          <ArborPanelTitle>Funding Rate Arbitrage Opportunities</ArborPanelTitle>
        </ArborPanelHeader>
        <ArborPanelContent>
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  className="w-full pl-9 pr-4 py-2 bg-background border rounded-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Markets Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Drift Funding Rate</TableHead>
                    <TableHead>Zeta Funding Rate</TableHead>
                    <TableHead>Rate Difference</TableHead>
                    <TableHead>Daily Arbitrage</TableHead>
                    <TableHead>Annualized</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMarkets.map((market) => (
                    <TableRow key={market.asset}>
                      <TableCell className="font-medium">{market.asset}</TableCell>
                      <TableCell>{formatFundingRate(market.drift?.fundingRate)}</TableCell>
                      <TableCell>{formatFundingRate(market.zeta?.fundingRate)}</TableCell>
                      <TableCell>{formatFundingRate(market.fundingRateDifference)}</TableCell>
                      <TableCell>{formatFundingRate(market.arbitrageRate)}</TableCell>
                      <TableCell>{formatFundingRate(market.annualizedArbitrageRate)}</TableCell>
                      <TableCell>
                        <span className={getRiskLevel(market.annualizedArbitrageRate).className}>
                          {getRiskLevel(market.annualizedArbitrageRate).level}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ArborPanelContent>
      </ArborPanel>
    </div>
  )
}
