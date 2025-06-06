'use client'

import { useState, useEffect } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Button } from '@/components/ui/button'
import {
  Search,
  TrendingUp,
  InfoIcon,
  BarChart3,
} from 'lucide-react'
import { StrategyTable } from '@/components/markets/strategy-table'
import { StrategyCards } from '@/components/markets/strategy-cards'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Strategy } from '@/types/strategy'

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

interface DeltaNeutralData {
  deltaNeutralOfferings: Strategy[]
  topArbitrageOpportunities: Strategy[]
}

export default function MarketsPage() {
  const [combinedMarkets, setCombinedMarkets] = useState<CombinedMarketData[]>([])
  const [deltaNeutralStrategies, setDeltaNeutralStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [dexFilter, setDexFilter] = useState('All')
  const [strategyTypeFilter, setStrategyTypeFilter] = useState('All')
  const [isMobile, setIsMobile] = useState(false)

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
        setDeltaNeutralStrategies(deltaNeutralData.deltaNeutralOfferings)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading market data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Tailwind's 'md' breakpoint is 768px
    }

    // Set initial value
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter delta-neutral strategies based on search query
  const filteredStrategies = deltaNeutralStrategies.filter(strategy => {
    const matchesSearch = strategy.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.longDex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.shortDex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.strategyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getStrategyName(strategy).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRisk = riskFilter === 'All' || strategy.riskAssessment === riskFilter
    const matchesDex = dexFilter === 'All' || strategy.longDex.name === dexFilter || strategy.shortDex.name === dexFilter
    const matchesStrategyType = strategyTypeFilter === 'All' || strategy.strategyType === strategyTypeFilter

    return matchesSearch && matchesRisk && matchesDex && matchesStrategyType
  })
  
  // Get strategy name format: <perp symbol>-<short dex>-<long dex>
  const getStrategyName = (strategy: Strategy): string => {
    return `${strategy.asset}-${strategy.shortDex.name}-${strategy.longDex.name}`
  }
  
  // Calculate position value in USDC
  const calculatePositionValueInUSDC = (strategy: Strategy): string => {
    const size = strategy.recommendedSize
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
            Daily and annualized funding rates
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Avg. Arb Rate</div>
              <div className="text-2xl font-bold text-foreground">
                {(combinedMarkets.reduce((sum, m) => sum + (m.arbitrageRate || 0), 0) / combinedMarkets.length).toFixed(2)}%
              </div>
            </div>
            <div className="p-2 bg-amber-100/20 rounded-md">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Average arbitrage rate across all markets
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Open Interest</div>
              <div className="text-2xl font-bold text-foreground">
                $1.2M
              </div>
            </div>
            <div className="p-2 bg-purple-100/20 rounded-md">
              <InfoIcon className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Total open interest on supported DEXes
          </div>
        </ArborPanel>
      </div>

      {/* Strategies Table */}
      <ArborPanel>
        <ArborPanelHeader>
          <ArborPanelTitle>Delta-Neutral Strategies</ArborPanelTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies..."
                className="pl-9 pr-3 py-2 rounded-md border text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="text-sm">Risk</span> ({riskFilter === 'All' ? 'All' : riskFilter})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by Risk</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={riskFilter} onValueChange={setRiskFilter}>
                  <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Low">Low</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Medium">Medium</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="High">High</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="text-sm">DEX</span> ({dexFilter === 'All' ? 'All' : dexFilter})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by DEX</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={dexFilter} onValueChange={setDexFilter}>
                  <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Drift">Drift</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Jupiter">Jupiter</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Meteora">Meteora</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Raydium">Raydium</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="text-sm">Type</span> ({strategyTypeFilter === 'All' ? 'All' : strategyTypeFilter})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by Strategy Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={strategyTypeFilter} onValueChange={setStrategyTypeFilter}>
                  <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Perp-Spot">Perp-Spot</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Spot-Spot">Spot-Spot</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu> */}
            <div className="text-xs text-muted-foreground ml-1">
              {filteredStrategies.length} of {deltaNeutralStrategies.length} strategies
            </div>
          </div>
        </ArborPanelHeader>
        
        <ArborPanelContent>
          {isMobile ? (
            <StrategyCards 
              filteredStrategies={filteredStrategies} 
              getStrategyName={getStrategyName} 
              calculatePositionValueInUSDC={calculatePositionValueInUSDC} 
            />
          ) : (
            <StrategyTable 
              filteredStrategies={filteredStrategies} 
              getStrategyName={getStrategyName} 
              calculatePositionValueInUSDC={calculatePositionValueInUSDC} 
            />
          )}
        </ArborPanelContent>
      </ArborPanel>
    </div>
  )
}
