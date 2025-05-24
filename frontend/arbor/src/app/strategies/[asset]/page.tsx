'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, PlusCircle, DollarSign, LogOut } from 'lucide-react'
import { StrategyDetailModal } from '@/components/markets/strategy-detail-modal'
import { StrategyOrderModal, StrategyActionModal } from '@/components/markets/strategy-order-modal'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

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
  activeOrders: Array<Order>
}

export interface Order {
  id: string
  side: string
  dex: string
  size: string
  entryPrice: string
  status: string
  createdAt: string
  wallet: string
  pnl: string
}

interface DeltaNeutralData {
  deltaNeutralOfferings: Strategy[]
  topArbitrageOpportunities: Strategy[]
}

export default function StrategyPage({ params }: { params: Promise<{ asset: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const assetName = decodeURIComponent(resolvedParams.asset)
  const { toast } = useToast()
  
  // Get the source page from URL params (default to markets if not provided)
  const fromPage = searchParams.get('from') || 'markets'
  
  // Handler functions for order actions
  const handleTopUpConfirm = (orderId: string, amount: number) => {
    console.log(`Topping up order: ${orderId} with amount: ${amount}`)
    // Implementation for depositing more funds into the strategy
    
    toast({
      variant: "info",
      title: "Top Up Order",
      description: `Added ${amount} USDC to order: ${orderId}`,
      action: (
        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
          <PlusCircle className="h-4 w-4 text-blue-600" />
        </div>
      ),
    });
  }
  
  const handleClaimYield = (orderId: string) => {
    console.log(`Claiming yield for order: ${orderId}`)
    // Implementation for claiming accrued yield
    toast({
      variant: "success",
      title: "Yield Claimed",
      description: `Successfully claimed yield for order: ${orderId}`,
      action: (
        <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </div>
      ),
    })
  }
  
  const handleWithdrawConfirm = (orderId: string, amount: number) => {
    console.log(`Withdrawing from order: ${orderId} with amount: ${amount}`)
    // Implementation for withdrawing funds from the strategy
    toast({
      variant: "warning",
      title: "Withdrawal Processed",
      description: `${amount} USDC withdrawn from order: ${orderId}`,
      action: (
        <div className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full">
          <LogOut className="h-4 w-4 text-amber-600" />
        </div>
      ),
    })
  }

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        const response = await fetch('/delta-neutral-perp-offerings.json')
        if (!response.ok) {
          throw new Error('Failed to fetch strategy data')
        }
        
        const data: DeltaNeutralData = await response.json()
        const assetStrategies = data.deltaNeutralOfferings.filter(
          strategy => strategy.asset === assetName
        )
        
        setStrategies(assetStrategies)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading strategy data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [assetName, resolvedParams.asset])

  // Calculate position value in USDC
  const calculatePositionValueInUSDC = (strategy: Strategy): string => {
    const size = parseFloat(strategy.recommendedSize)
    const price = strategy.longDex.price || 0
    
    // Looking at the data and the strategy-detail-modal.tsx implementation:
    // For BTC with price 1020708.47005, this means $1,020,708.47005
    // So 7.98 BTC would be worth approximately $8,145,253 USDC
    const totalValue = size * price
    
    return totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  // Calculate the average entry price
  const calculateAverageEntry = (orders: Order[]): string => {
    if (!orders || orders.length === 0) return '0.00'
    
    const totalSize = orders.reduce((sum, order) => sum + parseFloat(order.size), 0)
    const weightedSum = orders.reduce((sum, order) => 
      sum + (parseFloat(order.size) * parseFloat(order.entryPrice)), 0)
    
    return (weightedSum / totalSize).toFixed(2)
  }

  // Calculate total PnL for a set of orders
  const calculateTotalPnl = (orders: Order[]): number => {
    if (!orders || orders.length === 0) return 0
    
    return orders.reduce((sum, order) => sum + parseFloat(order.pnl), 0)
  }

  // Format PnL with + or - sign
  const formatPnl = (pnl: number): string => {
    return pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)
  }

  const getRiskClass = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-800'
      case 'Medium':
        return 'bg-amber-100 text-amber-800'
      case 'High':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading strategy data...</div>
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${fromPage}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to {fromPage.charAt(0).toUpperCase() + fromPage.slice(1)}
              </Button>
            </Link>
          </div>
          <Heading size="h3" decoration="branch">{assetName} Strategies</Heading>
          <Subheading>Delta-neutral arbitrage strategies for {assetName}</Subheading>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Arbor streamlines complex arbitrage strategies with powerful tools for both retail and institutional traders.
          </p>
        </div>

        {/* No action buttons here */}
      </div>

      {strategies.length === 0 ? (
        <ArborPanel className="py-16">
          <div className="text-center space-y-3">
            <p className="text-lg font-medium">No strategies available for {assetName}</p>
            <p className="text-muted-foreground">Check back later for new opportunities</p>
            <Link href={`/${fromPage}`}>
              <Button variant="outline" className="mt-4">
                {fromPage === 'portfolio' ? 'Back to Portfolio' : 'Explore Other Markets'}
              </Button>
            </Link>
          </div>
        </ArborPanel>
      ) : (
        <div className="space-y-6">
          {/* Strategy Table */}
          <ArborPanel>
            <ArborPanelHeader>
              <ArborPanelTitle>Available Strategies</ArborPanelTitle>
            </ArborPanelHeader>
            <ArborPanelContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="font-semibold">Strategy</TableHead>
                    <TableHead className="font-semibold">Position</TableHead>
                    <TableHead className="font-semibold">Annual Rate</TableHead>
                    <TableHead className="font-semibold">Daily Profit</TableHead>
                    <TableHead className="font-semibold">Recommended Size</TableHead>
                    <TableHead className="font-semibold">Risk</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategies.map((strategy, index) => (
                    <TableRow key={index} className="hover:bg-muted/5">
                      <TableCell className="font-medium">
                        <div>
                          {strategy.strategyType}
                          <div className="text-xs text-muted-foreground">
                            Identified on {new Date(strategy.identifiedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-1 rounded">LONG</span>
                            <span className="text-xs font-medium">{strategy.longDex.name.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-rose-100 text-rose-800 px-1 rounded">SHORT</span>
                            <span className="text-xs font-medium">{strategy.shortDex.name.toUpperCase()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-500 font-medium">
                        {strategy.arbitrageRateAnnualized}%
                        <div className="text-xs text-muted-foreground">{strategy.arbitrageRateDaily}% daily</div>
                      </TableCell>
                      <TableCell>
                        ${strategy.estimatedDailyProfit} USDC
                      </TableCell>
                      <TableCell>
                        {strategy.recommendedSize} {strategy.asset.split('-')[0]} <span className="text-xs text-muted-foreground">(${calculatePositionValueInUSDC(strategy)} USDC)</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-1.5 py-0.5 rounded-sm text-xs ${getRiskClass(strategy.riskAssessment)}`}>
                          {strategy.riskAssessment}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <StrategyDetailModal 
                            strategy={strategy} 
                            trigger={
                              <Button size="sm" variant="outline" className="text-xs">
                                Details <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Button>
                            } 
                          />
                          <StrategyOrderModal strategy={strategy} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ArborPanelContent>
          </ArborPanel>

          {/* Active Orders */}
          {strategies[0]?.activeOrders?.length > 0 && (
            <>
              <ArborPanel>
                <ArborPanelContent>
                  {/* Position Summary */}
                  <div className="bg-muted/10 rounded-md p-4 ">
                    <h4 className="text-md font-medium mb-3">Position Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Long Size</div>
                        <div className="text-sm font-medium">
                          {strategies[0].activeOrders.filter(o => o.side === 'long').reduce((sum, o) => sum + parseFloat(o.size), 0).toFixed(3)} {strategies[0].asset.split('-')[0]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Short Size</div>
                        <div className="text-sm font-medium">
                          {strategies[0].activeOrders.filter(o => o.side === 'short').reduce((sum, o) => sum + parseFloat(o.size), 0).toFixed(3)} {strategies[0].asset.split('-')[0]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Average Long Entry</div>
                        <div className="text-sm font-medium">
                          ${calculateAverageEntry(strategies[0].activeOrders.filter(o => o.side === 'long'))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Average Short Entry</div>
                        <div className="text-sm font-medium">
                          ${calculateAverageEntry(strategies[0].activeOrders.filter(o => o.side === 'short'))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Long PnL</div>
                        <div className={`text-sm font-medium ${calculateTotalPnl(strategies[0].activeOrders.filter(o => o.side === 'long')) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatPnl(calculateTotalPnl(strategies[0].activeOrders.filter(o => o.side === 'long')))} USDC
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Short PnL</div>
                        <div className={`text-sm font-medium ${calculateTotalPnl(strategies[0].activeOrders.filter(o => o.side === 'short')) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatPnl(calculateTotalPnl(strategies[0].activeOrders.filter(o => o.side === 'short')))} USDC
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Net Position</div>
                        <div className="text-sm font-medium">
                          {(strategies[0].activeOrders.filter(o => o.side === 'long').reduce((sum, o) => sum + parseFloat(o.size), 0) - 
                            strategies[0].activeOrders.filter(o => o.side === 'short').reduce((sum, o) => sum + parseFloat(o.size), 0)).toFixed(3)} {strategies[0].asset.split('-')[0]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total PnL</div>
                        <div className={`text-sm font-medium ${calculateTotalPnl(strategies[0].activeOrders) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatPnl(calculateTotalPnl(strategies[0].activeOrders))} USDC
                        </div>
                      </div>
                    </div>
                  </div>
                </ArborPanelContent>
              </ArborPanel>
              
              {/* Active Orders Table */}
              <ArborPanel>
                <ArborPanelHeader>
                  <ArborPanelTitle>Active Orders</ArborPanelTitle>
                </ArborPanelHeader>
                <ArborPanelContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10">
                          <TableHead className="font-semibold">Order ID</TableHead>
                          <TableHead className="font-semibold">Side</TableHead>
                          <TableHead className="font-semibold">DEX</TableHead>
                          <TableHead className="font-semibold">Size</TableHead>
                          <TableHead className="font-semibold">Entry Price</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Created</TableHead>
                          <TableHead className="font-semibold">PnL</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategies[0].activeOrders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-muted/5">
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
                              {order.size} {strategies[0].asset.split('-')[0]}
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
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <StrategyActionModal 
                                  orderId={order.id}
                                  assetUnit={strategies[0].asset.split('-')[0]}
                                  action="topUp"
                                  onConfirm={(amount) => handleTopUpConfirm(order.id, amount)}
                                  trigger={
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-xs"
                                    >
                                      Top Up
                                    </Button>
                                  }
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleClaimYield(order.id)}
                                >
                                  Claim Yield
                                </Button>
                                <StrategyActionModal 
                                  orderId={order.id}
                                  assetUnit={strategies[0].asset.split('-')[0]}
                                  action="withdraw"
                                  onConfirm={(amount) => handleWithdrawConfirm(order.id, amount)}
                                  trigger={
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    >
                                      Withdraw
                                    </Button>
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ArborPanelContent>
              </ArborPanel>
            </>
          )}
        </div>
      )}
    </div>
  )
}
