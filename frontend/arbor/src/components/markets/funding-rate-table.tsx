'use client'

import React, { useState, useEffect } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Search, FilterIcon, ArrowUpRight } from 'lucide-react'
import { StrategyDetailModal } from './strategy-detail-modal'

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

export function FundingRateTable() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'arbitrageRateAnnualized', direction: 'desc' })
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [riskFilter, setRiskFilter] = useState<string[]>(['Low', 'Medium', 'High'])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the delta-neutral offerings data
        const response = await fetch('/delta-neutral-perp-offerings.json')
        if (!response.ok) {
          throw new Error('Failed to fetch delta-neutral data')
        }
        const data: DeltaNeutralData = await response.json()
        setStrategies(data.deltaNeutralOfferings)
        setFilteredStrategies(data.deltaNeutralOfferings)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading strategy data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])
  
  // Apply filters and sorting whenever the dependencies change
  useEffect(() => {
    let result = [...strategies]
    
    // Apply search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      result = result.filter(
        (strategy) => 
          strategy.asset.toLowerCase().includes(lowerCaseQuery) || 
          strategy.longDex.name.toLowerCase().includes(lowerCaseQuery) ||
          strategy.shortDex.name.toLowerCase().includes(lowerCaseQuery) ||
          strategy.strategyType.toLowerCase().includes(lowerCaseQuery)
      )
    }
    
    // Apply risk filter
    if (riskFilter.length < 3) { // If not all risks are selected
      result = result.filter(strategy => riskFilter.includes(strategy.riskAssessment))
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle different data types for sorting
        let aValue, bValue
        
        switch(sortConfig.key) {
          case 'asset':
            aValue = a.asset
            bValue = b.asset
            break
          case 'arbitrageRateAnnualized':
            aValue = parseFloat(a.arbitrageRateAnnualized)
            bValue = parseFloat(b.arbitrageRateAnnualized)
            break
          case 'estimatedDailyProfit':
            aValue = parseFloat(a.estimatedDailyProfit)
            bValue = parseFloat(b.estimatedDailyProfit)
            break
          case 'riskAssessment':
            // Custom sort order for risk: Low, Medium, High
            const riskOrder = { 'Low': 0, 'Medium': 1, 'High': 2 }
            aValue = riskOrder[a.riskAssessment as keyof typeof riskOrder]
            bValue = riskOrder[b.riskAssessment as keyof typeof riskOrder]
            break
          default:
            aValue = a[sortConfig.key as keyof Strategy]
            bValue = b[sortConfig.key as keyof Strategy]
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    
    setFilteredStrategies(result)
  }, [strategies, searchQuery, sortConfig, riskFilter])
  
  // Function to toggle risk filter
  const toggleRiskFilter = (risk: string) => {
    if (riskFilter.includes(risk)) {
      setRiskFilter(riskFilter.filter(r => r !== risk))
    } else {
      setRiskFilter([...riskFilter, risk])
    }
  }

  // Calculate total PnL for a strategy
  const calculatePnL = (strategy: Strategy): string => {
    if (!strategy.activeOrders || strategy.activeOrders.length === 0) {
      return '$0.00 USDC'
    }
    
    const totalPnl = strategy.activeOrders.reduce((sum, order) => {
      return sum + parseFloat(order.pnl)
    }, 0)
    
    return totalPnl > 0 ? `+$${totalPnl.toFixed(2)} USDC` : `-$${Math.abs(totalPnl).toFixed(2)} USDC`
  }

  // Calculate inflows and outflows
  const calculateInflows = (strategy: Strategy): string => {
    // This would typically be calculated from actual data
    // For now, just use the estimated daily profit as a placeholder
    return `${strategy.estimatedDailyProfit}`
  }

  const calculateOutflows = (strategy: Strategy): string => {
    // This would typically be calculated from actual data
    // For now, just use a percentage of the inflows as a placeholder
    const outflow = parseFloat(strategy.estimatedDailyProfit) * 0.1 // 10% as placeholder
    return `${outflow.toFixed(2)}`
  }

  // Format the funding rate range
  const getFundingRateRange = (dex: DexInfo): { min: string, max: string, isPositive: boolean } => {
    // In a real app, this would be a min-max range based on historical data
    // For now, just create a range around the current rate
    const base = dex.fundingRate / 10000 // Convert to percentage
    const min = (base * 0.9)
    const max = (base * 1.1)
    const isPositive = base >= 0
    
    return {
      min: `${Math.abs(min).toFixed(4)}%`,
      max: `${Math.abs(max).toFixed(4)}%`,
      isPositive
    }
  }

  // Get the ratio between long and short positions
  const getLongShortRatio = (): string => {
    // In a real app, this would be calculated based on position sizes
    // For now, use a simple 2:1 ratio as a placeholder
    return '2:1'
  }

  // Calculate position size in USDC
  const getPositionSizeInUSDC = (strategy: Strategy): string => {
    // This would typically use actual position size calculations
    // For now, just use a simple calculation based on the recommended size and price
    const size = parseFloat(strategy.recommendedSize);
    const price = strategy.longDex.price || 0;
    const totalValue = size * price;
    return totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  // Format dates for duration
  const formatDuration = (strategy: Strategy): { oneWeek: string, twoWeeks: string } => {
    // This would typically be calculated based on the strategy
    // For now, just return placeholder values
    return {
      oneWeek: `${(parseFloat(strategy.estimatedDailyProfit) * 7).toFixed(2)}`,
      twoWeeks: `${(parseFloat(strategy.estimatedDailyProfit) * 14).toFixed(2)}`
    }
  }

  if (isLoading) {
    return <div>Loading funding rate data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  // Create strategy name format: <perp symbol>-<short dex>-<long dex>
  const getStrategyName = (strategy: Strategy): string => {
    return `${strategy.asset}-${strategy.shortDex.name}-${strategy.longDex.name}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Heading size="h3" decoration="branch">Funding Rate Explorer</Heading>
          <Subheading>Compare rates across markets for arbitrage opportunities</Subheading>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search markets..." 
              className="h-9 w-full md:w-48 rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FilterIcon className="h-3.5 w-3.5" /> 
              Filter {riskFilter.length < 3 && `(${riskFilter.length})`}
            </Button>
            
            {showFilterMenu && (
              <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-md p-3 shadow-lg z-20 min-w-[180px]">
                <div className="text-sm font-medium mb-2">Risk Level</div>
                <div className="space-y-1.5">
                  {['Low', 'Medium', 'High'].map((risk) => (
                    <label key={risk} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={riskFilter.includes(risk)} 
                        onChange={() => toggleRiskFilter(risk)}
                        className="rounded border-border text-primary h-4 w-4"
                      />
                      <span className="text-sm">{risk}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setRiskFilter(['Low', 'Medium', 'High'])}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilterMenu(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground ml-1">
            {filteredStrategies.length} of {strategies.length} strategies
          </div>
        </div>
      </div>

      <ArborPanel>
        <ArborPanelHeader>
          <ArborPanelTitle>Delta-Neutral Strategies</ArborPanelTitle>
        </ArborPanelHeader>
        
        <ArborPanelContent>
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
                      No strategies match your filters. Try adjusting your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStrategies.map((strategy) => {
                    const duration = formatDuration(strategy)
                    const pnl = calculatePnL(strategy)
                    const isPnlPositive = pnl.startsWith('+')
                    
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
                                Funding Rate Arbitrage
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
                            <div className="font-medium text-xs">Ratio L:S</div>
                            <div className="text-xs mt-1 font-semibold">{getLongShortRatio()}</div>
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
                        <div className="grid grid-cols-3 divide-x divide-border h-full">
                          <div className="p-3 flex flex-col items-center justify-center">
                            <div className="font-medium text-xs">Duration</div>
                            <div className="flex flex-col gap-1 mt-1 w-full">
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px]">1W:</span>
                                <span className="text-[10px] font-semibold text-emerald-500">${duration.oneWeek} USDC</span>
                              </div>
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px]">2W:</span>
                                <span className="text-[10px] font-semibold text-emerald-500">${duration.twoWeeks} USDC</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col items-center justify-center">
                            <div className="font-medium text-xs">Flow</div>
                            <div className="w-full mt-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px]">In:</span>
                                <span className="text-[10px] font-semibold text-emerald-500">${calculateInflows(strategy)} USDC</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]">Out:</span>
                                <span className="text-[10px] font-semibold text-rose-400">${calculateOutflows(strategy)} USDC</span>
                              </div>
                              <div className="w-full bg-muted/30 h-1 mt-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full" 
                                  style={{ 
                                    width: `${Math.min(90, 100 - (parseFloat(calculateOutflows(strategy)) / parseFloat(calculateInflows(strategy)) * 100))}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col items-center justify-center">
                            <div className="font-medium text-xs">PnL</div>
                            <div className={`text-xs mt-1 font-semibold ${isPnlPositive ? 'text-emerald-500 flex items-center' : 'text-rose-400 flex items-center'}`}>
                              {isPnlPositive ? 
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> :
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1"></span>
                              }
                              {pnl}
                            </div>
                            {strategy.activeOrders.length > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {strategy.activeOrders.length} order{strategy.activeOrders.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Funding Rates */}
                      <TableCell className="p-0">
                        <div className="grid grid-cols-2 divide-x divide-border h-full">
                          <div className="p-2 flex flex-col items-center justify-center">
                            <div className="font-medium text-xs">Long</div>
                            {(() => {
                              const { min, max, isPositive } = getFundingRateRange(strategy.longDex);
                              const textColor = isPositive ? 'text-emerald-500' : 'text-rose-400';
                              return (
                                <div className="flex flex-col items-center text-[10px] mt-1 leading-tight">
                                  <span className={textColor}>{isPositive ? '+' : '-'}{min}</span>
                                  <span className="text-muted-foreground text-[9px] mx-1">to</span>
                                  <span className={textColor}>{isPositive ? '+' : '-'}{max}</span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="p-2 flex flex-col items-center justify-center">
                            <div className="font-medium text-xs">Short</div>
                            {(() => {
                              const { min, max, isPositive } = getFundingRateRange(strategy.shortDex);
                              const textColor = isPositive ? 'text-emerald-500' : 'text-rose-400';
                              return (
                                <div className="flex flex-col items-center text-[10px] mt-1 leading-tight">
                                  <span className={textColor}>{isPositive ? '+' : '-'}{min}</span>
                                  <span className="text-muted-foreground text-[9px] mx-1">to</span>
                                  <span className={textColor}>{isPositive ? '+' : '-'}{max}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="p-3">
                        <div className="flex flex-col gap-1.5 items-center justify-center h-full">
                          <Button variant="default" size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-1.5">
                            Place Order
                          </Button>
                          <StrategyDetailModal 
                            strategy={strategy} 
                            trigger={
                              <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs py-1.5">
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            }
                          />
                          <div className="text-[10px] text-muted-foreground text-center">
                            Size: ${getPositionSizeInUSDC(strategy)} USDC
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }))}
              
              </TableBody>
            </Table>
          </div>
        </ArborPanelContent>
      </ArborPanel>
    </div>
  )
}
