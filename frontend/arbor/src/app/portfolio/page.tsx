'use client'

import { useState, useEffect } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RadixTabs, RadixTabsContent, RadixTabsList, RadixTabsTrigger } from '@/components/ui/radix-tabs'
import { 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  Wallet, 
  TrendingUp, 
  ArrowDownUp, 
  Filter, 
  Search,
  CircleDollarSign,
  Gauge,
  Library,
  BarChart4,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { StrategyDetailModal } from '@/components/markets/strategy-detail-modal'

interface Order {
  id: string
  asset: string
  side: string
  dex: string
  size: string
  entryPrice: string
  status: string
  createdAt: string
  wallet: string
  pnl: string
}

interface PortfolioSummary {
  totalActiveOrders: number
  totalInvested: string
  estimatedDailyProfit: string
  estimatedAnnualProfit: string
  riskExposure: {
    low: number
    medium: number
    high: number
  }
}

interface PortfolioData {
  summary: PortfolioSummary
  allOrders: Order[]
}

interface Strategy {
  asset: string
  longDex: {
    name: string
    fundingRate: number
    price?: number
  }
  shortDex: {
    name: string
    fundingRate: number
    price?: number
  }
  arbitrageRateAnnualized: string
  arbitrageRateDaily: string
  recommendedSize: string
  estimatedDailyProfit: string
  estimatedAnnualProfit: string
  riskAssessment: string
  strategyType: string
  identifiedAt: string
  activeOrders: Order[]
}

interface DeltaNeutralData {
  deltaNeutralOfferings: Strategy[]
  topArbitrageOpportunities: Strategy[]
  portfolio: PortfolioData
}

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'asset', direction: 'asc' })

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        const response = await fetch('/delta-neutral-perp-offerings.json')
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data')
        }
        
        const data: DeltaNeutralData = await response.json()
        setPortfolioData(data.portfolio)
        
        // Create active strategies based on orders
        const uniqueAssets = [...new Set(data.portfolio.allOrders.map(order => order.asset))]
        
        // Match orders to strategies
        const strategies = uniqueAssets.map(asset => {
          const matchingStrategy = data.deltaNeutralOfferings.find(s => s.asset === asset) || data.topArbitrageOpportunities.find(s => s.asset === asset)
          const assetOrders = data.portfolio.allOrders.filter(o => o.asset === asset)
          
          // If we found a matching strategy, use it as a base and add the orders
          if (matchingStrategy) {
            return {
              ...matchingStrategy,
              activeOrders: assetOrders
            }
          }
          
          // If no matching strategy, create a placeholder
          const longOrders = assetOrders.filter(o => o.side === 'long')
          const shortOrders = assetOrders.filter(o => o.side === 'short')
          
          return {
            asset,
            longDex: {
              name: longOrders.length > 0 ? longOrders[0].dex : 'unknown',
              fundingRate: 0
            },
            shortDex: {
              name: shortOrders.length > 0 ? shortOrders[0].dex : 'unknown',
              fundingRate: 0
            },
            arbitrageRateAnnualized: '0',
            arbitrageRateDaily: '0',
            recommendedSize: '0',
            estimatedDailyProfit: '0',
            estimatedAnnualProfit: '0',
            riskAssessment: 'Medium',
            strategyType: 'Unknown',
            identifiedAt: new Date().toISOString(),
            activeOrders: assetOrders
          }
        })
        
        setActiveStrategies(strategies)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading portfolio data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  // Group orders by asset
  const getOrdersByAsset = () => {
    if (!portfolioData) return {}
    
    const grouped: Record<string, Order[]> = {}
    
    portfolioData.allOrders.forEach(order => {
      if (!grouped[order.asset]) {
        grouped[order.asset] = []
      }
      grouped[order.asset].push(order)
    })
    
    return grouped
  }

  // Filter orders by search query
  const filteredOrders = portfolioData?.allOrders.filter(order => {
    if (!searchQuery) return true
    return (
      order.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.dex.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }) || []

  // Calculate total PnL
  const calculateTotalPnl = (): number => {
    if (!portfolioData) return 0
    return portfolioData.allOrders.reduce((sum, order) => sum + parseFloat(order.pnl), 0)
  }

  // Format PnL with + or - sign
  const formatPnl = (pnl: number): string => {
    return pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`
  }

  // Calculate profit percentage
  const calculateProfitPercentage = (): string => {
    if (!portfolioData) return '0'
    const totalInvested = parseFloat(portfolioData.summary.totalInvested)
    const totalPnl = calculateTotalPnl()
    
    return ((totalPnl / totalInvested) * 100).toFixed(2)
  }

  if (isLoading) {
    return <div className="p-8">Loading portfolio data...</div>
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Heading size="h3" decoration="branch">Portfolio</Heading>
        <Subheading>Manage your delta-neutral positions and performance</Subheading>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Arbor streamlines complex arbitrage strategies with powerful tools for both retail and institutional traders.
        </p>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-foreground">${Number(portfolioData?.summary.totalInvested || 0).toLocaleString()}</div>
            </div>
            <div className="p-2 bg-blue-100/20 rounded-md">
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Across {portfolioData?.allOrders.length || 0} active orders
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Daily Profit Est.</div>
              <div className="text-2xl font-bold text-foreground">${Number(portfolioData?.summary.estimatedDailyProfit || 0).toLocaleString()}</div>
            </div>
            <div className="p-2 bg-violet-100/20 rounded-md">
              <TrendingUp className="h-5 w-5 text-violet-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            ${Number(portfolioData?.summary.estimatedAnnualProfit || 0).toLocaleString()} annualized
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Current PnL</div>
              <div className={`text-2xl font-bold ${calculateTotalPnl() >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatPnl(calculateTotalPnl())}
              </div>
            </div>
            <div className="p-2 bg-emerald-100/20 rounded-md">
              <CircleDollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {calculateProfitPercentage()}% return on investment
          </div>
        </ArborPanel>

        <ArborPanel className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Risk Distribution</div>
              <div className="text-2xl font-bold text-foreground flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> {portfolioData?.summary.riskExposure.low || 0}
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-500 ml-2"></span> {portfolioData?.summary.riskExposure.medium || 0}
                <span className="inline-block w-3 h-3 rounded-sm bg-rose-500 ml-2"></span> {portfolioData?.summary.riskExposure.high || 0}
              </div>
            </div>
            <div className="p-2 bg-amber-100/20 rounded-md">
              <PieChart className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Low / Medium / High risk exposure
          </div>
        </ArborPanel>
      </div>

      {/* Portfolio Performance Graph */}
      <ArborPanel>
        <ArborPanelHeader>
          <ArborPanelTitle>Portfolio Performance</ArborPanelTitle>
        </ArborPanelHeader>
        <ArborPanelContent>
          <div className="flex items-center justify-center h-[300px] bg-muted/5 rounded-md mb-4 border border-dashed border-border">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Performance chart would be displayed here</p>
              <p className="text-sm text-muted-foreground mt-1">Showing historical PnL, funding rates, and position value over time</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">7-Day Returns</div>
              <div className="text-lg font-semibold text-emerald-500">+$71,738.80</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">30-Day Returns</div>
              <div className="text-lg font-semibold text-emerald-500">+$307,452.00</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Funding Collected</div>
              <div className="text-lg font-semibold text-emerald-500">+$23,542.19</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Net Asset Value</div>
              <div className="text-lg font-semibold">${Number(portfolioData?.summary.totalInvested || 0).toLocaleString()}</div>
            </div>
          </div>
        </ArborPanelContent>
      </ArborPanel>

      {/* Active Strategies & Orders */}
      <RadixTabs defaultValue="strategies">
        <RadixTabsList className="grid grid-cols-2 mb-4">
          <RadixTabsTrigger value="strategies" className="flex items-center justify-center gap-1.5">
            <Library className="h-4 w-4" /> Active Strategies
          </RadixTabsTrigger>
          <RadixTabsTrigger value="orders" className="flex items-center justify-center gap-1.5">
            <BarChart4 className="h-4 w-4" /> All Orders
          </RadixTabsTrigger>
        </RadixTabsList>

        {/* Strategies Tab */}
        <RadixTabsContent value="strategies">
          <ArborPanel>
            <ArborPanelHeader>
              <ArborPanelTitle>Active Strategies</ArborPanelTitle>
            </ArborPanelHeader>
            <ArborPanelContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Showing {activeStrategies.length} active strategies</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search assets..." 
                      className="h-9 w-full md:w-48 rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => {
                      const nextSortOptions = [
                        { key: 'asset', direction: 'asc' as const },
                        { key: 'asset', direction: 'desc' as const },
                        { key: 'pnl', direction: 'desc' as const },
                        { key: 'pnl', direction: 'asc' as const }
                      ];
                      
                      const currentIndex = nextSortOptions.findIndex(
                        option => option.key === sortConfig.key && option.direction === sortConfig.direction
                      );
                      const nextIndex = (currentIndex + 1) % nextSortOptions.length;
                      setSortConfig(nextSortOptions[nextIndex]);
                    }}
                  >
                    <ArrowDownUp className="h-3.5 w-3.5" /> 
                    Sort
                  </Button>
                </div>
              </div>
              
              {activeStrategies.length === 0 ? (
                <div className="bg-muted/5 rounded-md p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">No active strategies</p>
                  <p className="text-muted-foreground mb-4">You don't have any active strategies in your portfolio.</p>
                  <Link href="/markets">
                    <Button>Explore Markets</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeStrategies
                    .filter(strategy => 
                      !searchQuery || 
                      strategy.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      strategy.strategyType.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((strategy, index) => {
                      // Calculate strategy PnL
                      const strategyPnl = strategy.activeOrders.reduce((sum, order) => 
                        sum + parseFloat(order.pnl), 0)
                      
                      // Calculate long/short balance
                      const longSize = strategy.activeOrders
                        .filter(o => o.side === 'long')
                        .reduce((sum, o) => sum + parseFloat(o.size), 0)
                      
                      const shortSize = strategy.activeOrders
                        .filter(o => o.side === 'short')
                        .reduce((sum, o) => sum + parseFloat(o.size), 0)
                      
                      const deltaImbalance = Math.abs(longSize - shortSize)
                      const isBalanced = deltaImbalance / (longSize + shortSize) < 0.2 // Less than 20% imbalance
                      
                      return (
                        <ArborPanel key={index} className="p-4 h-full">
                          <div className="flex justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-muted/20 flex items-center justify-center">
                                <span className="text-xs font-bold">{strategy.asset.split('-')[0]}</span>
                              </div>
                              <div>
                                <div className="font-medium">{strategy.asset}</div>
                                <div className="text-xs text-muted-foreground">{strategy.strategyType}</div>
                              </div>
                            </div>
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded-sm text-xs ${
                                strategy.riskAssessment === 'Low' ? 'bg-emerald-100 text-emerald-800' : 
                                strategy.riskAssessment === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {strategy.riskAssessment} Risk
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Orders</div>
                              <div className="font-medium">{strategy.activeOrders.length}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Current PnL</div>
                              <div className={`font-medium ${strategyPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {strategyPnl >= 0 ? '+' : ''}{strategyPnl.toFixed(2)} USDC
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Long/Short</div>
                              <div className="font-medium text-xs">
                                <span className="text-emerald-500">{longSize.toFixed(3)}</span>
                                {' / '}
                                <span className="text-rose-500">{shortSize.toFixed(3)}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Delta Status</div>
                              <div className="font-medium">
                                <span className={`inline-block px-1.5 py-0.5 rounded-sm text-xs ${
                                  isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isBalanced ? 'Balanced' : 'Imbalanced'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="text-xs text-muted-foreground">Strategy Health</div>
                            <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                              {strategyPnl >= 0 ? (
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (strategyPnl / 100) * 100)}%` }}></div>
                              ) : (
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (Math.abs(strategyPnl) / 100) * 100)}%` }}></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-3 pt-3 border-t border-border">
                            <Link href={`/strategies/${strategy.asset}`}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                View Orders
                              </Button>
                            </Link>
                            <StrategyDetailModal
                              strategy={strategy}
                              trigger={
                                <Button variant="outline" size="sm" className="text-xs">
                                  Strategy Details <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                              }
                            />
                          </div>
                        </ArborPanel>
                      )
                    })
                  }
                </div>
              )}
            </ArborPanelContent>
          </ArborPanel>
        </RadixTabsContent>

        {/* Orders Tab */}
        <RadixTabsContent value="orders">
          <ArborPanel>
            <ArborPanelHeader>
              <ArborPanelTitle>All Orders</ArborPanelTitle>
            </ArborPanelHeader>
            <ArborPanelContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Showing {filteredOrders.length} of {portfolioData?.allOrders.length || 0} orders
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search orders..." 
                      className="h-9 w-full md:w-48 rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="font-semibold">Asset</TableHead>
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Side</TableHead>
                      <TableHead className="font-semibold">DEX</TableHead>
                      <TableHead className="font-semibold">Size</TableHead>
                      <TableHead className="font-semibold">Entry Price</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">PnL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No orders match your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/5">
                          <TableCell>
                            <Link href={`/strategies/${order.asset}`} className="flex items-center">
                              <div className="p-1 rounded-md bg-muted/20 mr-2">
                                <span className="text-xs font-bold">{order.asset.split('-')[0]}</span>
                              </div>
                              <span className="underline-offset-4 hover:underline">{order.asset}</span>
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {order.id}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-block px-1.5 py-0.5 rounded-sm text-xs ${
                              order.side === 'long' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {order.side.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="uppercase font-medium">
                            {order.dex}
                          </TableCell>
                          <TableCell>
                            {order.size} {order.asset.split('-')[0]}
                          </TableCell>
                          <TableCell>
                            ${order.entryPrice}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-block px-1.5 py-0.5 rounded-sm text-xs ${
                              order.status === 'filled' ? 'bg-emerald-100 text-emerald-800' : 
                              order.status === 'open' ? 'bg-blue-100 text-blue-800' : 
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className={parseFloat(order.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {parseFloat(order.pnl) >= 0 ? '+' : ''}{order.pnl} USDC
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ArborPanelContent>
          </ArborPanel>
        </RadixTabsContent>
      </RadixTabs>

      {/* Risk Assessment */}
      <ArborPanel>
        <ArborPanelHeader>
          <ArborPanelTitle>Risk Analysis</ArborPanelTitle>
        </ArborPanelHeader>
        <ArborPanelContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Risk Exposure</h4>
                  <p className="text-sm text-muted-foreground">
                    Your portfolio is balanced with a mix of low, medium, and high risk strategies.
                    {portfolioData?.summary.riskExposure.high || 0 > 3 ? 
                      " Consider reducing high-risk exposure." : 
                      " Current risk distribution is optimal."}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pl-10">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Low Risk</span>
                  <span className="text-sm font-medium">{portfolioData?.summary.riskExposure.low || 0} strategies</span>
                </div>
                <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ 
                    width: `${(portfolioData?.summary.riskExposure.low || 0) / 
                      ((portfolioData?.summary.riskExposure.low || 0) + 
                       (portfolioData?.summary.riskExposure.medium || 0) + 
                       (portfolioData?.summary.riskExposure.high || 0)) * 100}%` 
                  }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medium Risk</span>
                  <span className="text-sm font-medium">{portfolioData?.summary.riskExposure.medium || 0} strategies</span>
                </div>
                <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ 
                    width: `${(portfolioData?.summary.riskExposure.medium || 0) / 
                      ((portfolioData?.summary.riskExposure.low || 0) + 
                       (portfolioData?.summary.riskExposure.medium || 0) + 
                       (portfolioData?.summary.riskExposure.high || 0)) * 100}%` 
                  }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Risk</span>
                  <span className="text-sm font-medium">{portfolioData?.summary.riskExposure.high || 0} strategies</span>
                </div>
                <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ 
                    width: `${(portfolioData?.summary.riskExposure.high || 0) / 
                      ((portfolioData?.summary.riskExposure.low || 0) + 
                       (portfolioData?.summary.riskExposure.medium || 0) + 
                       (portfolioData?.summary.riskExposure.high || 0)) * 100}%` 
                  }}></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Asset Diversification</h4>
                  <p className="text-sm text-muted-foreground">
                    Your portfolio is spread across {Object.keys(getOrdersByAsset()).length} different assets.
                    {Object.keys(getOrdersByAsset()).length < 3 ? 
                      " Consider diversifying into more assets." : 
                      " Good diversification across multiple assets."}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pl-10">
                {Object.entries(getOrdersByAsset()).map(([asset, orders]) => (
                  <div key={asset} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{asset}</span>
                      <span className="text-sm font-medium">{orders.length} orders</span>
                    </div>
                    <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ 
                        width: `${(orders.length / portfolioData!.allOrders.length) * 100}%` 
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-foreground/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">Risk Recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your current portfolio, here are some recommendations to optimize risk and returns.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 pl-10">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-emerald-100">
                    <span className="text-xs text-emerald-800 font-medium">1</span>
                  </div>
                  <p className="text-sm">
                    Consider balancing your BTC-PERP positions for better delta neutrality
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-emerald-100">
                    <span className="text-xs text-emerald-800 font-medium">2</span>
                  </div>
                  <p className="text-sm">
                    Explore opportunities in ETH-PERP to diversify your position further
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-emerald-100">
                    <span className="text-xs text-emerald-800 font-medium">3</span>
                  </div>
                  <p className="text-sm">
                    Monitor funding rates for SOL-PERP to optimize profit potential
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pl-10">
                <Link href="/markets">
                  <Button variant="outline" size="sm" className="w-full">
                    Explore New Opportunities
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ArborPanelContent>
      </ArborPanel>
    </div>
  )
}