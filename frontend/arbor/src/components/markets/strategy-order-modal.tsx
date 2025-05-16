'use client'

import { useState, useEffect } from 'react'
import { Leaf, ArrowUpRight, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Heading, Subheading } from '@/components/ui/headings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TreeNode } from '@/components/ui/tree-node'
import { ArborPanel, ArborPanelContent, ArborPanelHeader, ArborPanelTitle } from '@/components/ui/arbor-panel'

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
}

export function StrategyOrderModal({ strategy, trigger }: StrategyOrderModalProps) {
  const [open, setOpen] = useState(false)
  const [collateralAmount, setCollateralAmount] = useState(1000)
  const [leverageMultiplier, setLeverageMultiplier] = useState(2)
  const [riskLevel, setRiskLevel] = useState("medium")
  const [allocationRatio, setAllocationRatio] = useState(50) // 50% to each side
  const { toast } = useToast()

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
    
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Place {strategy.strategyType} Order
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
          <Button variant="outline" onClick={() => setOpen(false)}>
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
