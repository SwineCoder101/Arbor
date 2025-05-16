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
                    <div className="h-[150px] bg-muted/30 rounded-lg flex items-center justify-center">
                      <div className="text-center text-sm text-muted-foreground">
                        Inflow & outflow volume area chart would display here
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
                    <div className="h-[200px] bg-muted/30 rounded-lg flex items-center justify-center">
                      <div className="text-center text-sm text-muted-foreground">
                        Bell-shaped curves showing funding rate distribution<br />
                        with medians and means over history
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
                    onClick={() => setOpen(false)} // Close detail modal first
                  >
                    Place Order
                  </Button>
                }
              />
            </div>
          </RadixTabsContent>
        </RadixTabs>
      </DialogContent>
    </Dialog>
  )
}
