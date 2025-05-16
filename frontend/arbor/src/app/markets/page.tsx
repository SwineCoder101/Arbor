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
  const [driftPerps, setDriftPerps] = useState<PerpsData[]>([])
  const [zetaPerps, setZetaPerps] = useState<PerpsData[]>([])
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
        
        setDriftPerps(driftData)
        setZetaPerps(zetaData)
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
    let direction: 'asc' | 'desc' = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
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
        <Subheading>Explore arbitrage opportunities across markets</Subheading>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Arbor streamlines delta neutral arbitrage strategies with powerful tools for both retail and institutional traders.
        </p>
      </div>

      {/* Market Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Markets</div>
              <div className="text-2xl font-bold text-foreground">{combinedMarkets.length}</div>
            </div>
            <div className="p-2 bg-blue-100/20 rounded-md">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Across multiple DEXes on Solana
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Highest Funding</div>
              <div className="text-2xl font-bold text-foreground flex items-center">
                <span className="text-emerald-500 mr-1">+</span>
                {Math.max(...combinedMarkets.flatMap(m => [
                  m.drift?.fundingRate || -Infinity, 
                  m.zeta?.fundingRate || -Infinity
                ].filter(v => v !== -Infinity))) / 10000}%
              </div>
            </div>
            <div className="p-2 bg-emerald-100/20 rounded-md">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {combinedMarkets.find(m => 
              (m.drift?.fundingRate || 0) / 10000 === Math.max(...combinedMarkets.map(m => (m.drift?.fundingRate || 0) / 10000)) ||
              (m.zeta?.fundingRate || 0) / 10000 === Math.max(...combinedMarkets.map(m => (m.zeta?.fundingRate || 0) / 10000))
            )?.asset || 'N/A'}
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Lowest Funding</div>
              <div className="text-2xl font-bold text-foreground flex items-center">
                <span className="text-rose-500 mr-1">-</span>
                {Math.abs(Math.min(...combinedMarkets.flatMap(m => [
                  m.drift?.fundingRate || Infinity, 
                  m.zeta?.fundingRate || Infinity
                ].filter(v => v !== Infinity))) / 10000)}%
              </div>
            </div>
            <div className="p-2 bg-rose-100/20 rounded-md">
              <TrendingDown className="h-5 w-5 text-rose-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {combinedMarkets.find(m => 
              (m.drift?.fundingRate || 0) / 10000 === Math.min(...combinedMarkets.map(m => (m.drift?.fundingRate || 0) / 10000)) ||
              (m.zeta?.fundingRate || 0) / 10000 === Math.min(...combinedMarkets.map(m => (m.zeta?.fundingRate || 0) / 10000))
            )?.asset || 'N/A'}
          </div>
        </ArborPanel>
      </div>
      <div className="mt-6">
        <ArborPanel>
          <ArborPanelHeader>
            <ArborPanelTitle>Delta-Neutral Strategies</ArborPanelTitle>
          </ArborPanelHeader>
          
          <ArborPanelContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Showing {filteredStrategies.length} of {deltaNeutralStrategies.length} strategies
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search strategies..." 
                    className="h-9 w-full md:w-48 rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm"
                    value={strategySearchQuery}
                    onChange={(e) => setStrategySearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="sticky left-0 bg-background z-10 font-semibold">Strategy Name</TableHead>
                    <TableHead className="text-center">DEX Details</TableHead>
                    <TableHead className="text-center">Position Info</TableHead>
                    <TableHead className="text-center">Financial Data</TableHead>
                    <TableHead className="text-center">Funding Rates</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStrategies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No strategies match your search criteria. Try adjusting your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStrategies.map((strategy) => {
                      // Format funding rates and prepare data for display
                      const longFundingRate = strategy.longDex.fundingRate / 10000;
                      const shortFundingRate = strategy.shortDex.fundingRate / 10000;
                      
                      return (
                        <TableRow 
                          key={getStrategyName(strategy)} 
                          className="hover:bg-muted/5 group"
                        >
                          {/* Strategy Name - Fixed on left side */}
                          <TableCell className="sticky left-0 bg-background z-10 group-hover:bg-muted/5 font-medium h-full p-3">
                            <div className="flex items-start h-full">
                              <div className="p-1.5 rounded-md bg-muted/20 mr-2.5 flex items-center justify-center min-w-[36px]">
                                <span className="text-xs font-bold uppercase">{strategy.asset.split('-')[0]}</span>
                              </div>
                              <div className="flex flex-col justify-between h-full">
                                <div>
                                  <div className="font-medium">{getStrategyName(strategy)}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {strategy.strategyType}
                                  </div>
                                </div>
                                <div className="mt-1.5 text-[9px]">
                                  <span className={`inline-block px-1 py-0.5 rounded-sm leading-none ${
                                    strategy.riskAssessment === 'Low' ? 'bg-emerald-100 text-emerald-800' : 
                                    strategy.riskAssessment === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {strategy.riskAssessment}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* DEX Details */}
                          <TableCell className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-border h-full">
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Long DEX</div>
                                <div className="uppercase tracking-wider text-xs font-medium mt-1">{strategy.longDex.name}</div>
                              </div>
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Short DEX</div>
                                <div className="uppercase tracking-wider text-xs font-medium mt-1">{strategy.shortDex.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Position Info */}
                          <TableCell className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-border h-full">
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Size</div>
                                <div className="text-xs mt-1 font-semibold">
                                  {strategy.recommendedSize} {strategy.asset.split('-')[0]}
                                </div>
                              </div>
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Arb Rate</div>
                                <div className="text-xs mt-1 text-emerald-500 font-semibold">
                                  {parseFloat(strategy.arbitrageRateAnnualized) > 0.1 ? 
                                    <span className="flex items-center">
                                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                                      {strategy.arbitrageRateAnnualized}%
                                    </span> : 
                                    strategy.arbitrageRateAnnualized + '%'
                                  }
                                </div>
                                <div className="text-[10px] text-muted-foreground">{strategy.arbitrageRateDaily}% daily</div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Financial Data */}
                          <TableCell className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-border h-full">
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Daily Profit</div>
                                <div className="text-xs mt-1 font-semibold text-emerald-500">
                                  ${strategy.estimatedDailyProfit} USDC
                                </div>
                              </div>
                              <div className="p-3 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Value</div>
                                <div className="text-xs mt-1 font-semibold">
                                  ${calculatePositionValueInUSDC(strategy)} USDC
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Funding Rates */}
                          <TableCell className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-border h-full">
                              <div className="p-2 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Long</div>
                                <div className={`text-xs mt-1 ${longFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                                  {longFundingRate >= 0 ? '+' : ''}{longFundingRate.toFixed(6)}%
                                </div>
                              </div>
                              <div className="p-2 flex flex-col items-center justify-center">
                                <div className="font-medium text-xs">Short</div>
                                <div className={`text-xs mt-1 ${shortFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                                  {shortFundingRate >= 0 ? '+' : ''}{shortFundingRate.toFixed(6)}%
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="p-3">
                            <div className="flex flex-col gap-1.5 items-center justify-center h-full">
                              <Link href={`/strategies/${strategy.asset}`}>
                                <Button variant="arbor-outline" size="sm" className="w-full h-8 text-xs">
                                  View Strategy <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ArborPanelContent>
        </ArborPanel>
      </div>

      {/* Market Information */}
      <ArborPanel variant="gradient">
        <ArborPanelHeader>
          <ArborPanelTitle>Understanding Funding Rates</ArborPanelTitle>
        </ArborPanelHeader>
        <ArborPanelContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <InfoIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">What are Funding Rates?</h4>
                  <p className="text-sm text-muted-foreground">
                    Funding rates are periodic payments exchanged between long and short positions in perpetual contracts.
                    They help keep the perpetual price aligned with the underlying asset's spot price.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Positive Funding Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    When funding is positive, long positions pay short positions. This typically occurs when perpetual
                    prices are trading above the index price, incentivizing more shorts to enter.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Negative Funding Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    When funding is negative, short positions pay long positions. This occurs when perpetual
                    prices are trading below the index price, incentivizing more longs to enter.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Arbitrage Opportunities</h4>
                  <p className="text-sm text-muted-foreground">
                    When two DEXes have significantly different funding rates for the same asset, traders can
                    capture the rate differential by going long on the exchange with negative (or lower) funding
                    and short on the exchange with positive (or higher) funding.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Annualized Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Annualized rate represents the potential annual return from capturing funding rate differentials,
                    assuming rates remain constant throughout the year. It's calculated as the funding rate difference
                    multiplied by the number of funding periods in a year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ArborPanelContent>
      </ArborPanel>
    </div>
  )
}
