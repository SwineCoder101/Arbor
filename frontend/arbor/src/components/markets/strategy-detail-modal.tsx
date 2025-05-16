'use client'

import { useState, useEffect } from 'react'
import { ArrowUpDownIcon, BarChart3Icon, CircleDollarSignIcon, ExternalLinkIcon, TrendingUpIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heading, Subheading } from '@/components/ui/headings'
import { ArborPanel, ArborPanelContent, ArborPanelHeader, ArborPanelTitle } from '@/components/ui/arbor-panel'
import { RadixTabs, RadixTabsContent, RadixTabsList, RadixTabsTrigger } from '@/components/ui/radix-tabs'
import { StrategyOrderModal } from './strategy-order-modal'

// Performance Chart Component
interface PerformanceChartProps {
  asset: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface AssetPerformanceData {
  title: string;
  description: string;
  timeframe: string;
  initialDeposit: number;
  profitabilityThreshold: number;
  longShortSpread: ChartDataPoint[];
  cumulativeReturns: ChartDataPoint[];
}

interface PerformanceData {
  performanceData: {
    [key: string]: AssetPerformanceData;
  };
}

function PerformanceChart({ asset }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<AssetPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        setLoading(true);
        const response = await fetch('/strategy-performance-chart.json');
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        
        const data: PerformanceData = await response.json();
        const assetData = data.performanceData[asset];
        
        if (!assetData) {
          setError(`No data available for ${asset}`);
          return;
        }
        
        setChartData(assetData);
      } catch (err) {
        setError('Error loading chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChartData();
  }, [asset]);

  if (loading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-muted-foreground">
          {error || `No performance data available for ${asset}`}
        </div>
      </div>
    );
  }

  // In a real implementation, we would render a dynamic chart using a charting library
  // For now, we'll display our placeholder with some extracted data
  const currentValue = chartData.cumulativeReturns[chartData.cumulativeReturns.length - 1].value;
  const initialValue = chartData.initialDeposit;
  const percentageGain = ((currentValue - initialValue) / initialValue * 100).toFixed(2);
  
  return (
    <div className="space-y-4">
      <div className="h-[350px] w-full rounded-lg relative overflow-hidden" id="performanceChart">
        <div className="absolute inset-0 p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">{chartData.title}</h4>
            <div className="text-xs text-muted-foreground">{chartData.timeframe}</div>
          </div>
          
          <div className="h-[280px] w-full relative">
            <img src="/performance-chart-placeholder.svg" alt="Performance Chart" className="w-full h-full object-cover" />
            
            {/* Overlay some stats from our actual JSON data */}
            <div className="absolute top-4 right-4 bg-background/80 p-2 rounded-md backdrop-blur-sm">
              <div className="text-sm font-medium">Initial: ${initialValue.toLocaleString()}</div>
              <div className="text-sm font-medium text-emerald-500">
                Current: ${currentValue.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-500">+{percentageGain}%</div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              <span>{chartData.cumulativeReturns[0].date}</span>
              <span>{chartData.cumulativeReturns[chartData.cumulativeReturns.length - 1].date}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between mt-3 text-xs">
            <div className="flex items-center gap-1 mr-4 mb-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Account Value</span>
            </div>
            <div className="flex items-center gap-1 mr-4 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Funding Rate Spread</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-1 bg-rose-400/60"></div>
              <span>Threshold ({chartData.profitabilityThreshold*100}%)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm">
        <p className="text-muted-foreground mb-2">{chartData.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground">Highest Spread</div>
            <div className="font-medium">{Math.max(...chartData.longShortSpread.map(d => d.value))*100}%</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground">Lowest Spread</div>
            <div className="font-medium">{Math.min(...chartData.longShortSpread.map(d => d.value))*100}%</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground">Profitable Days</div>
            <div className="font-medium">
              {chartData.longShortSpread.filter(d => d.value > chartData.profitabilityThreshold).length} days
            </div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-muted-foreground">Unprofitable Days</div>
            <div className="font-medium">
              {chartData.longShortSpread.filter(d => d.value <= chartData.profitabilityThreshold).length} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Types imported from funding-rate-table.tsx
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

interface StrategyDetailModalProps {
  strategy: Strategy
  trigger?: React.ReactNode
}

export function StrategyDetailModal({ strategy, trigger }: StrategyDetailModalProps) {
  const [open, setOpen] = useState(false)
  const [shouldOpenOrderModal, setShouldOpenOrderModal] = useState(false)

  // Calculate position size in USDC
  const getPositionSizeInUSDC = (): string => {
    const size = parseFloat(strategy.recommendedSize)
    const price = strategy.longDex.price || 0
    const totalValue = size * price
    return totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  // Format the date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate total PnL for a strategy
  const calculatePnL = (): { value: string, isPositive: boolean } => {
    if (!strategy.activeOrders || strategy.activeOrders.length === 0) {
      return { value: '$0.00 USDC', isPositive: true }
    }
    
    const totalPnl = strategy.activeOrders.reduce((sum, order) => {
      return sum + parseFloat(order.pnl)
    }, 0)
    
    const isPositive = totalPnl >= 0
    const formattedValue = isPositive 
      ? `+$${totalPnl.toFixed(2)} USDC` 
      : `-$${Math.abs(totalPnl).toFixed(2)} USDC`
    
    return { value: formattedValue, isPositive }
  }

  // Get strategy name format: <perp symbol>-<short dex>-<long dex>
  const getStrategyName = (): string => {
    return `${strategy.asset}-${strategy.shortDex.name}-${strategy.longDex.name}`
  }

  // Format funding rate for display
  const formatFundingRate = (rate: number): string => {
    // Convert from basis points to percentage
    const percentage = rate / 10000
    return `${percentage.toFixed(4)}%`
  }

  const pnl = calculatePnL()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            View Details <ArrowUpDownIcon className="h-3 w-3 ml-1" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted/20 flex items-center justify-center min-w-[36px]">
              <span className="text-xs font-bold uppercase">{strategy.asset.split('-')[0]}</span>
            </div>
            {getStrategyName()}
            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ml-2 ${
              strategy.riskAssessment === 'Low' ? 'bg-emerald-100 text-emerald-800' : 
              strategy.riskAssessment === 'Medium' ? 'bg-amber-100 text-amber-800' : 
              'bg-rose-100 text-rose-800'
            }`}>
              {strategy.riskAssessment} Risk
            </span>
          </DialogTitle>
          <DialogDescription>
            Funding Rate Arbitrage • Identified on {formatDate(strategy.identifiedAt)}
          </DialogDescription>
        </DialogHeader>

        <RadixTabs defaultValue="overview" className="mt-4">
          <RadixTabsList className="grid grid-cols-3 mb-4">
            <RadixTabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3Icon className="h-4 w-4" /> Overview
            </RadixTabsTrigger>
            <RadixTabsTrigger value="performance" className="flex items-center gap-1.5">
              <TrendingUpIcon className="h-4 w-4" /> Performance
            </RadixTabsTrigger>
            <RadixTabsTrigger value="funding" className="flex items-center gap-1.5">
              <CircleDollarSignIcon className="h-4 w-4" /> Funding Analysis
            </RadixTabsTrigger>
          </RadixTabsList>

          {/* Overview Tab */}
          <RadixTabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Strategy Overview */}
              <ArborPanel>
                <ArborPanelHeader>
                  <ArborPanelTitle>⚖️ Strategy Overview</ArborPanelTitle>
                </ArborPanelHeader>
                <ArborPanelContent className="prose prose-sm dark:prose-invert max-w-none">
                  <p>
                    This delta-neutral strategy is designed for yield generation by balancing long and short positions 
                    across markets to generate returns while minimizing directional exposure to asset price movements.
                  </p>
                  <p>
                    The strategy operator actively manages allocations, guided by data analytics for optimization, allowing users
                    to deposit stablecoins into a strategy that captures funding rate differentials between {strategy.longDex.name} and {strategy.shortDex.name}.
                  </p>
                </ArborPanelContent>
              </ArborPanel>

              {/* Key Metrics */}
              <ArborPanel>
                <ArborPanelHeader>
                  <ArborPanelTitle>📈 Key Metrics</ArborPanelTitle>
                </ArborPanelHeader>
                <ArborPanelContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Annual Return Rate</div>
                      <div className="text-lg font-semibold text-emerald-500">{strategy.arbitrageRateAnnualized}%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Daily Return Rate</div>
                      <div className="text-lg font-semibold text-emerald-500">{strategy.arbitrageRateDaily}%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Recommended Size</div>
                      <div className="text-lg font-semibold">{strategy.recommendedSize} {strategy.asset.split('-')[0]}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Position Value</div>
                      <div className="text-lg font-semibold">${getPositionSizeInUSDC()} USDC</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Projected Daily Profit</div>
                      <div className="text-lg font-semibold text-emerald-500">${strategy.estimatedDailyProfit} USDC</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Current Position PnL</div>
                      <div className={`text-lg font-semibold ${pnl.isPositive ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {pnl.value}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Long Market</div>
                      <div className="text-lg font-semibold uppercase">{strategy.longDex.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Short Market</div>
                      <div className="text-lg font-semibold uppercase">{strategy.shortDex.name}</div>
                    </div>
                  </div>

                </ArborPanelContent>
              </ArborPanel>
            </div>

          </RadixTabsContent>

          {/* Performance Tab */}
          <RadixTabsContent value="performance" className="space-y-4">
            <ArborPanel>
              <ArborPanelHeader>
                <ArborPanelTitle>📊 Performance Visualization</ArborPanelTitle>
              </ArborPanelHeader>
              <ArborPanelContent>
                <PerformanceChart asset={strategy.asset} />
                
                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <Heading size="h5">Forecasted Returns</Heading>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">7 Days</span>
                        <span className="font-medium text-emerald-500">
                          ${(parseFloat(strategy.estimatedDailyProfit) * 7).toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/50 rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">30 Days</span>
                        <span className="font-medium text-emerald-500">
                          ${(parseFloat(strategy.estimatedDailyProfit) * 30).toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/50 rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">365 Days</span>
                        <span className="font-medium text-emerald-500">
                          ${strategy.estimatedAnnualProfit} USDC
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/50 rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Heading size="h5">Volume Analysis</Heading>
                    <div className="h-[150px] bg-muted/30 rounded-lg p-3 relative">
                      {/* Volume Analysis Chart */}
                      <div className="absolute inset-0 p-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs text-muted-foreground">Volume (USD)</div>
                          <div className="flex space-x-2 text-xs">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div>
                              <span>Inflow</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-rose-500 mr-1"></div>
                              <span>Outflow</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-[120px] relative">
                          {/* Y-axis */}
                          <div className="absolute left-0 h-full flex flex-col justify-between items-end pr-1 text-[10px] text-muted-foreground">
                            <span>100K</span>
                            <span>50K</span>
                            <span>0</span>
                          </div>
                          
                          {/* Chart area */}
                          <div className="absolute left-8 right-0 h-full">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                            </div>
                            
                            {/* Outflow Area (Red) */}
                            <div className="absolute inset-0">
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <defs>
                                  <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.2"/>
                                    <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                <path 
                                  d="M0,70 C5,75 15,78 25,72 C35,66 45,70 55,74 C65,78 75,75 85,68 C95,61 100,65 100,60 L100,100 L0,100 Z" 
                                  fill="url(#outflowGradient)"
                                  stroke="none"
                                />
                                <path 
                                  d="M0,70 C5,75 15,78 25,72 C35,66 45,70 55,74 C65,78 75,75 85,68 C95,61 100,65 100,60" 
                                  fill="none"
                                  stroke="rgb(244, 63, 94)"
                                  strokeWidth="1"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            
                            {/* Inflow Area (Green) */}
                            <div className="absolute inset-0">
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <defs>
                                  <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2"/>
                                    <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                <path 
                                  d="M0,50 C10,45 20,40 30,36 C40,32 50,30 60,35 C70,40 80,30 90,25 C95,22 100,20 100,20 L100,100 L0,100 Z" 
                                  fill="url(#inflowGradient)"
                                  stroke="none"
                                />
                                <path 
                                  d="M0,50 C10,45 20,40 30,36 C40,32 50,30 60,35 C70,40 80,30 90,25 C95,22 100,20 100,20" 
                                  fill="none"
                                  stroke="rgb(16, 185, 129)"
                                  strokeWidth="1"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            
                            {/* X-axis time markers */}
                            <div className="absolute inset-x-0 bottom-[-18px] flex justify-between text-[10px] text-muted-foreground">
                              <span>Apr 15</span>
                              <span>Apr 22</span>
                              <span>Apr 29</span>
                              <span>May 6</span>
                              <span>May 13</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats overlay */}
                      <div className="absolute top-3 right-3 bg-background/90 text-xs p-1.5 rounded-md backdrop-blur-sm">
                        <div className="flex flex-col gap-1">
                          <div>Net Volume: <span className="text-emerald-500">+$32.45K</span></div>
                          <div>7D Inflow: <span className="font-medium">$89.75K</span></div>
                          <div>7D Outflow: <span className="font-medium">$57.30K</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ArborPanelContent>
            </ArborPanel>
          </RadixTabsContent>

          {/* Funding Analysis Tab */}
          <RadixTabsContent value="funding" className="space-y-4">
            <ArborPanel>
              <ArborPanelContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Heading size="h5" className="mb-3">Current Funding Rates</Heading>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Long ({strategy.longDex.name})</div>
                        <div className={`text-lg font-semibold ${strategy.longDex.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {formatFundingRate(strategy.longDex.fundingRate)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Short ({strategy.shortDex.name})</div>
                        <div className={`text-lg font-semibold ${strategy.shortDex.fundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                          {formatFundingRate(strategy.shortDex.fundingRate)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Heading size="h5" className="mb-3">Rate Differential</Heading>
                      <div className="px-4 py-6 bg-muted/30 rounded-lg text-center">
                        <div className="text-3xl font-bold text-emerald-500">
                          {(Math.abs(strategy.longDex.fundingRate - strategy.shortDex.fundingRate) / 10000).toFixed(4)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Spread between {strategy.longDex.name} and {strategy.shortDex.name}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Heading size="h5" className="mb-3">Historical Rate Distribution</Heading>
                    <div className="h-[200px] bg-muted/30 rounded-lg p-3 relative">
                      {/* Historical Rate Distribution Chart */}
                      <div className="absolute inset-0 p-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs text-muted-foreground">Distribution Frequency</div>
                          <div className="flex space-x-3 text-xs">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                              <span>{strategy.longDex.name}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-violet-500 mr-1"></div>
                              <span>{strategy.shortDex.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-[170px] relative">
                          {/* Chart area */}
                          <div className="absolute inset-0">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pt-5 pb-10">
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                              <div className="border-t border-dashed border-muted-foreground/20 h-0"></div>
                            </div>
                            
                            {/* Bell curves */}
                            <div className="absolute inset-0 pt-5">
                              {/* Long DEX curve */}
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <defs>
                                  <linearGradient id="longGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                <path 
                                  d="M0,80 C5,78 10,72 15,60 C20,48 25,30 30,20 C35,10 40,5 50,2 C60,5 65,10 70,20 C75,30 80,48 85,60 C90,72 95,78 100,80 L100,100 L0,100 Z" 
                                  fill="url(#longGradient)"
                                  stroke="none"
                                />
                                <path 
                                  d="M0,80 C5,78 10,72 15,60 C20,48 25,30 30,20 C35,10 40,5 50,2 C60,5 65,10 70,20 C75,30 80,48 85,60 C90,72 95,78 100,80" 
                                  fill="none"
                                  stroke="rgb(59, 130, 246)"
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                {/* Mean vertical line */}
                                <line x1="50" y1="0" x2="50" y2="80" stroke="rgb(59, 130, 246)" strokeWidth="1" strokeDasharray="2,2" />
                              </svg>
                            </div>
                            
                            {/* Short DEX curve (slightly offset) */}
                            <div className="absolute inset-0 pt-5">
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <defs>
                                  <linearGradient id="shortGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="rgb(124, 58, 237)" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                <path 
                                  d="M10,85 C15,83 20,77 25,65 C30,53 35,35 40,25 C45,15 50,10 60,7 C70,10 75,15 80,25 C85,35 90,53 95,65 C100,77 105,83 110,85 L110,100 L10,100 Z" 
                                  fill="url(#shortGradient)"
                                  stroke="none"
                                />
                                <path 
                                  d="M10,85 C15,83 20,77 25,65 C30,53 35,35 40,25 C45,15 50,10 60,7 C70,10 75,15 80,25 C85,35 90,53 95,65 C100,77 105,83 110,85" 
                                  fill="none"
                                  stroke="rgb(124, 58, 237)"
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                {/* Mean vertical line */}
                                <line x1="60" y1="0" x2="60" y2="85" stroke="rgb(124, 58, 237)" strokeWidth="1" strokeDasharray="2,2" />
                              </svg>
                            </div>
                            
                            {/* X-axis */}
                            <div className="absolute bottom-2 inset-x-0 flex justify-between text-[10px] text-muted-foreground">
                              <span>-0.04%</span>
                              <span>-0.02%</span>
                              <span>0%</span>
                              <span>+0.02%</span>
                              <span>+0.04%</span>
                            </div>
                            
                            {/* Rate differential highlight */}
                            <div className="absolute bottom-6 w-full flex justify-center">
                              <div className="px-2 py-0.5 bg-background/90 text-[10px] rounded backdrop-blur-sm">
                                <span className="text-emerald-500 font-medium">+{(Math.abs(strategy.longDex.fundingRate - strategy.shortDex.fundingRate) / 10000).toFixed(4)}%</span> spread
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats overlay */}
                      <div className="absolute top-3 right-3 bg-background/90 text-xs p-1.5 rounded-md backdrop-blur-sm">
                        <div className="flex flex-col gap-1">
                          <div>{strategy.longDex.name} Mean: <span className="font-medium">{formatFundingRate(strategy.longDex.fundingRate * 0.8)}</span></div>
                          <div>{strategy.shortDex.name} Mean: <span className="font-medium">{formatFundingRate(strategy.shortDex.fundingRate * 0.9)}</span></div>
                          <div>Volatility: <span className="font-medium text-amber-500">Medium</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Heading size="h5" className="mb-3">Strategy Insight</Heading>
                  <p className="text-sm">
                    This Funding Rate Arbitrage strategy exploits the funding rate differential between {strategy.longDex.name} and {strategy.shortDex.name} 
                    for {strategy.asset}. By taking opposite positions on both platforms, the strategy remains delta-neutral while 
                    generating yield from the rate spread. The current differential suggests 
                    an {strategy.arbitrageRateAnnualized}% annualized return with {strategy.riskAssessment.toLowerCase()} risk exposure.
                  </p>
                </div>
              </ArborPanelContent>
            </ArborPanel>

            <div className="flex justify-end gap-2">
              <Button variant="outline">
                Download Historical Data
              </Button>
              <StrategyOrderModal 
                strategy={strategy} 
                trigger={
                  <Button 
                    variant="default" 
                    className="bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => {
                      // Close the current modal and set flag to open order modal
                      setShouldOpenOrderModal(true);
                      // setOpen(false);
                    }}
                  >
                    Place Order
                  </Button>
                }
                open={shouldOpenOrderModal}
                onOpenChange={(state) => setShouldOpenOrderModal(state)}
              />
            </div>
          </RadixTabsContent>
        </RadixTabs>
      </DialogContent>
    </Dialog>
  )
}
