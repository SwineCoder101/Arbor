'use client'

import { ArborPanel, ArborPanelContent, ArborPanelHeader, ArborPanelTitle } from '@/components/ui/arbor-panel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TreeNode } from '@/components/ui/tree-node'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Leaf } from 'lucide-react'
import { useEffect, useState } from 'react'

// Types imported from strategy-detail-modal.tsx
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

interface StrategyOrderModalProps {
  strategy: Strategy
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function StrategyOrderModal({ strategy, trigger, open: externalOpen, onOpenChange }: StrategyOrderModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Determine whether to use external or internal state
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  
  // Handle dialog open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }
  const [collateralAmount, setCollateralAmount] = useState(1000)
  const [leverageMultiplier, setLeverageMultiplier] = useState(2)
  const [riskLevel, setRiskLevel] = useState("medium")
  const [allocationRatio, setAllocationRatio] = useState(50) // 50% to each side
  const { toast } = useToast()
  
  // Initialize with recommended amounts from strategy
  useEffect(() => {
    if (strategy && strategy.recommendedSize && strategy.longDex.price) {
      // Convert recommended asset size to USDC value
      const recommendedUsdcValue = parseFloat(strategy.recommendedSize) * (strategy.longDex.price || 0);
      if (!isNaN(recommendedUsdcValue) && recommendedUsdcValue > 0) {
        // Use half the recommended value as default collateral amount
        setCollateralAmount(Math.round(recommendedUsdcValue / 2));
      }
    }
  }, [strategy])

  // Calculate recommended strategy size in asset units based on current price
  const getAssetUnit = (): string => {
    return strategy.asset.split('-')[0]
  }

  // Calculate expected position sizes based on inputs
  const calculatePositionSizes = () => {
    const longAllocation = (collateralAmount * (allocationRatio / 100)) * leverageMultiplier
    const shortAllocation = (collateralAmount * ((100 - allocationRatio) / 100)) * leverageMultiplier
    
    const assetPrice = strategy.longDex.price || 0
    
    // Convert USD to asset units
    const longSize = assetPrice > 0 ? longAllocation / assetPrice : 0
    const shortSize = assetPrice > 0 ? shortAllocation / assetPrice : 0
    
    return {
      longAllocationUSD: longAllocation.toFixed(2),
      shortAllocationUSD: shortAllocation.toFixed(2),
      longSize: longSize.toFixed(4),
      shortSize: shortSize.toFixed(4)
    }
  }

  const positions = calculatePositionSizes()

  // Format funding rate for display
  const formatFundingRate = (rate: number): string => {
    // Convert from basis points to percentage
    const percentage = rate / 10000
    return `${percentage.toFixed(4)}%`
  }

  // Calculate estimated daily return
  const calculateEstimatedReturn = (): string => {
    // Base this on the arbitrage rate and the collateral amount
    const dailyRatePercentage = parseFloat(strategy.arbitrageRateDaily) / 100
    const estimatedDaily = collateralAmount * dailyRatePercentage * (leverageMultiplier / 2) // Simplified estimation
    return estimatedDaily.toFixed(2)
  }

  // Risk parameters based on selected risk level
  const getRiskParams = () => {
    switch(riskLevel) {
      case "low":
        return {
          maxSlippage: "0.2%",
          stopLoss: "1%",
          takeProfit: "3%",
          healthThreshold: "1.5"
        }
      case "medium":
        return {
          maxSlippage: "0.5%",
          stopLoss: "2%",
          takeProfit: "5%",
          healthThreshold: "1.2"
        }
      case "high":
        return {
          maxSlippage: "1.0%",
          stopLoss: "5%",
          takeProfit: "10%",
          healthThreshold: "1.1"
        }
      default:
        return {
          maxSlippage: "0.5%", 
          stopLoss: "2%",
          takeProfit: "5%",
          healthThreshold: "1.2"
        }
    }
  }

  const riskParams = getRiskParams()

  // Handle order placement
  const handlePlaceOrder = () => {
    console.log("Placing order with parameters:", {
      strategy: strategy.strategyType,
      asset: strategy.asset,
      collateralAmount,
      leverageMultiplier,
      longDex: strategy.longDex.name,
      shortDex: strategy.shortDex.name,
      longAllocation: positions.longAllocationUSD,
      shortAllocation: positions.shortAllocationUSD,
      riskParameters: riskParams
    })
    
    // Here you would integrate with your order placement API
    
    // Show toast notification
    toast({
      variant: "success",
      title: "Order Placed Successfully",
      description: `Strategy order placed for ${strategy.asset} with ${collateralAmount} USDC collateral`,
      action: (
        <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
        </div>
      ),
    });
    
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="arbor" className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
            Place Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted/20 flex items-center justify-center min-w-[36px]">
              <span className="text-xs font-bold uppercase">{getAssetUnit()}</span>
            </div>
            Place Funding Rate Arbitrage Order
          </DialogTitle>
          <DialogDescription>
            Configure your delta-neutral strategy parameters and place your order
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Strategy Configuration Panel */}
          <ArborPanel>
            <ArborPanelHeader>
              <ArborPanelTitle>Strategy Configuration</ArborPanelTitle>
            </ArborPanelHeader>
            <ArborPanelContent>
              <div className="space-y-4">
                {/* Collateral Amount */}
                <div className="space-y-2">
                  <Label htmlFor="collateral">USDC Collateral Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="collateral"
                      type="number"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(Number(e.target.value))}
                      min={100}
                      step={100}
                    />
                    <span className="flex items-center text-sm text-muted-foreground">USDC</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum: 100 USDC, Recommended: {parseFloat(strategy.recommendedSize) * (strategy.longDex.price || 0) / 2} USDC
                  </p>
                </div>

                {/* Leverage Multiplier */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="leverage">Leverage Multiplier: {leverageMultiplier}x</Label>
                    <span className="text-xs text-muted-foreground">Applied to both positions</span>
                  </div>
                  <div>
                    <Input
                      id="leverage"
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={leverageMultiplier}
                      onChange={(e) => setLeverageMultiplier(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1x</span>
                    <span>2x</span>
                    <span>3x</span>
                    <span>4x</span>
                    <span>5x</span>
                  </div>
                </div>

                {/* Position Allocation Ratio */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="allocation">Position Allocation: {allocationRatio}% / {100 - allocationRatio}%</Label>
                    <span className="text-xs text-muted-foreground">Long / Short</span>
                  </div>
                  <div>
                    <Input
                      id="allocation"
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={allocationRatio}
                      onChange={(e) => setAllocationRatio(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-500">Long: {positions.longAllocationUSD} USDC</span>
                    <span className="text-rose-500">Short: {positions.shortAllocationUSD} USDC</span>
                  </div>
                </div>

                {/* Risk Level */}
                <div className="space-y-2">
                  <Label>Risk Parameters</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="low" 
                        value="low" 
                        checked={riskLevel === "low"} 
                        onChange={() => setRiskLevel("low")}
                      />
                      <Label htmlFor="low" className="text-xs cursor-pointer">Low</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="medium" 
                        value="medium" 
                        checked={riskLevel === "medium"} 
                        onChange={() => setRiskLevel("medium")}
                      />
                      <Label htmlFor="medium" className="text-xs cursor-pointer">Medium</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id="high" 
                        value="high" 
                        checked={riskLevel === "high"} 
                        onChange={() => setRiskLevel("high")}
                      />
                      <Label htmlFor="high" className="text-xs cursor-pointer">High</Label>
                    </div>
                  </div>
                </div>
              </div>
            </ArborPanelContent>
          </ArborPanel>

          {/* Strategy Visualization */}
          <ArborPanel>
            <ArborPanelHeader>
              <ArborPanelTitle>Strategy Visualization</ArborPanelTitle>
            </ArborPanelHeader>
            <ArborPanelContent>
              <div className="space-y-6">
                <TreeNode
                  title={`${getAssetUnit()} ${strategy.strategyType}`}
                  subtitle="Delta-neutral funding rate strategy"
                  variant="primary"
                  active
                  icon={<Leaf className="h-4 w-4" />}
                />
                
                <div className="grid grid-cols-1 gap-4">
                  <TreeNode
                    title={`Long ${getAssetUnit()}-PERP`}
                    subtitle={strategy.longDex.name}
                    connected="top"
                    connectionLabel="Long Position"
                    variant="accent"
                  >
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{positions.longSize} {getAssetUnit()} (${positions.longAllocationUSD} USDC)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Leverage:</span>
                        <span>{leverageMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latest Funding:</span>
                        <span className={strategy.longDex.fundingRate >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {formatFundingRate(strategy.longDex.fundingRate)}
                        </span>
                      </div>
                    </div>
                  </TreeNode>
                  
                  <TreeNode
                    title={`Short ${getAssetUnit()}-PERP`}
                    subtitle={strategy.shortDex.name}
                    connected="top"
                    connectionLabel="Short Hedge"
                    variant="accent"
                  >
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{positions.shortSize} {getAssetUnit()} (${positions.shortAllocationUSD} USDC)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Leverage:</span>
                        <span>{leverageMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latest Funding:</span>
                        <span className={strategy.shortDex.fundingRate >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {formatFundingRate(strategy.shortDex.fundingRate)}
                        </span>
                      </div>
                    </div>
                  </TreeNode>
                  
                  <TreeNode
                    title="Risk Parameters"
                    subtitle="Strategy protection settings"
                    connected="top"
                    connectionLabel="Risk Controls"
                    variant="muted"
                  >
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Slippage:</span>
                        <span>{riskParams.maxSlippage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stop Loss:</span>
                        <span>{riskParams.stopLoss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Take Profit:</span>
                        <span>{riskParams.takeProfit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Health Threshold:</span>
                        <span>{riskParams.healthThreshold}</span>
                      </div>
                    </div>
                  </TreeNode>
                </div>
              </div>
            </ArborPanelContent>
          </ArborPanel>
        </div>
        
        {/* Risk Analysis Panel */}
        <ArborPanel className="mt-6">
          <ArborPanelHeader>
            <ArborPanelTitle>Risk Analysis Breakdown</ArborPanelTitle>
          </ArborPanelHeader>
          <ArborPanelContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Risk Factors */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Risk Factors & Mitigations</h4>
                
                <div className="space-y-3">
                  <div className="p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-md">
                    <h5 className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                      <span className="flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Market Volatility Risk
                    </h5>
                    <p className="text-xs">
                      Sudden price movements can cause liquidation of one or both positions.
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-medium">Mitigation:</span> Delta-neutral strategy reduces directional exposure. Stop-loss at {riskParams.stopLoss} prevents catastrophic losses.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50 rounded-md">
                    <h5 className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                      <span className="flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400">
                          <path d="M10 2a.75.75 0 0 1 .75.75v5.59l1.95-2.1a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0L6.2 7.26a.75.75 0 1 1 1.1-1.02l1.95 2.1V2.75A.75.75 0 0 1 10 2Z" />
                          <path d="M5.273 4.5a1.25 1.25 0 0 0-1.205.918l-1.523 5.52c-.006.02-.01.041-.015.062H6a1 1 0 0 1 .894.553l.448.894a1 1 0 0 0 .894.553h3.438a1 1 0 0 0 .86-.49l.606-1.02A1 1 0 0 1 14 11h3.47a1.318 1.318 0 0 0-.015-.062l-1.523-5.52a1.25 1.25 0 0 0-1.205-.918h-.977a.75.75 0 0 1 0-1.5h.977a2.75 2.75 0 0 1 2.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3.73c0-.246.033-.492.099-.731l1.523-5.52A2.75 2.75 0 0 1 5.273 3h.977a.75.75 0 0 1 0 1.5h-.977Z" />
                        </svg>
                      </span>
                      Funding Rate Change
                    </h5>
                    <p className="text-xs">
                      Funding rates may converge or flip direction, reducing or eliminating profit.
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-medium">Mitigation:</span> Take profit threshold at {riskParams.takeProfit} locks in gains. Positions can be closed before funding rates change significantly.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900/50 rounded-md">
                    <h5 className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                      <span className="flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400">
                          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Liquidity Risk
                    </h5>
                    <p className="text-xs">
                      Low liquidity on one or both exchanges can cause slippage or prevent timely exits.
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-medium">Mitigation:</span> Max slippage limit set to {riskParams.maxSlippage}. Position sizes optimized for market depth.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Risk Matrix */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Risk Metrics</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-medium mb-2">Liquidation Risk Assessment</h5>
                    <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          riskLevel === "low" ? "w-1/4 bg-emerald-500" : 
                          riskLevel === "medium" ? "w-1/2 bg-amber-500" : 
                          "w-3/4 bg-rose-500"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Lower</span>
                      <span>Higher</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/20 rounded-md">
                      <h5 className="text-xs font-medium mb-1">Max Drawdown Estimate</h5>
                      <p className="text-sm font-semibold">
                        {riskLevel === "low" ? "3-5%" : riskLevel === "medium" ? "5-10%" : "10-15%"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on historical volatility
                      </p>
                    </div>
                    
                    <div className="p-3 bg-muted/20 rounded-md">
                      <h5 className="text-xs font-medium mb-1">Risk/Reward Ratio</h5>
                      <p className="text-sm font-semibold">
                        {riskLevel === "low" ? "1:3" : riskLevel === "medium" ? "1:4" : "1:6"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Potential downside vs. upside
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/10 border border-muted/20 rounded-md">
                    <h5 className="text-xs font-medium mb-2">Strategy Health Score</h5>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            riskLevel === "low" 
                              ? "w-[85%] bg-emerald-500" 
                              : riskLevel === "medium" 
                                ? "w-[70%] bg-amber-500" 
                                : "w-[55%] bg-rose-500"
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium">{
                        riskLevel === "low" 
                          ? "85/100" 
                          : riskLevel === "medium" 
                            ? "70/100" 
                            : "55/100"
                      }</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Combined assessment of market conditions, exchange reliability, and strategy parameters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-md">
              <h5 className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                  </svg>
                </span>
                Risk Summary
              </h5>
              <p className="text-xs">
                {riskLevel === "low" 
                  ? "Conservative approach with minimal market exposure. Lower profit potential but higher safety margin against liquidation and market volatility." 
                  : riskLevel === "medium" 
                    ? "Balanced risk-reward profile optimized for current market conditions. Moderate profit potential with reasonable safeguards against adverse scenarios."
                    : "Aggressive approach to maximize yield potential. Higher exposure to market volatility and liquidity risks with increased profit opportunity."
                }
              </p>
            </div>
          </ArborPanelContent>
        </ArborPanel>

        {/* Order Summary */}
        <ArborPanel className="mt-4">
          <ArborPanelHeader>
            <ArborPanelTitle>Order Summary</ArborPanelTitle>
          </ArborPanelHeader>
          <ArborPanelContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Collateral</div>
                <div className="text-lg font-semibold">{collateralAmount} USDC</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Effective Exposure</div>
                <div className="text-lg font-semibold">{(collateralAmount * leverageMultiplier).toFixed(2)} USDC</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Estimated Daily Yield</div>
                <div className="text-lg font-semibold text-emerald-500">${calculateEstimatedReturn()} USDC</div>
              </div>
            </div>
          </ArborPanelContent>
        </ArborPanel>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handlePlaceOrder}
          >
            Confirm Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// TopUp Modal Component
export interface StrategyActionModalProps {
  orderId: string;
  assetUnit: string;
  action: 'topUp' | 'withdraw';
  onConfirm: (amount: number) => void;
  trigger?: React.ReactNode;
}

export function StrategyActionModal({ orderId, assetUnit, action, onConfirm, trigger }: StrategyActionModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const { toast } = useToast();
  
  const actionTitle = action === 'topUp' ? 'Top Up' : 'Withdraw';
  const actionDescription = action === 'topUp' 
    ? `Add additional funds to your ${assetUnit} strategy order` 
    : `Withdraw funds from your ${assetUnit} strategy order`;
  
  const handleConfirm = () => {
    console.log(`${actionTitle} action with amount:`, amount);
    onConfirm(amount);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {actionTitle} Order
          </DialogTitle>
          <DialogDescription>
            {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={10}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {action === 'topUp' 
                ? 'Enter the amount you want to add to this position' 
                : 'Enter the amount you want to withdraw from this position'}
            </p>
          </div>

          <div className="bg-muted/20 p-3 rounded-md space-y-2">
            <h4 className="text-sm font-medium">Order Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{orderId}</span>
              
              <span className="text-muted-foreground">Asset:</span>
              <span>{assetUnit}</span>
              
              <span className="text-muted-foreground">{action === 'topUp' ? 'Top Up' : 'Withdrawal'} Amount:</span>
              <span>{amount} USDC</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={handleConfirm}
          >
            Confirm {actionTitle}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
