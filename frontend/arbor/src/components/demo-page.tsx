'use client'

import React from 'react'
import { AppHero } from './app-hero'
import { Button } from './ui/button'
import { ArborPanel } from './ui/arbor-panel'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { MarketsProvider } from './markets/markets-provider'
import { MarketsOverview } from './markets/markets-overview'
import { FundingRateAggregator } from './markets/funding-rate-aggregator'
import { Heading, Subheading } from './ui/headings'
import { StrategyCard } from './ui/strategy-card'
import { DataCard } from './ui/data-card'
import { StatsGrid, StatCard } from './ui/stats-grid'
import { TreeNode } from './ui/tree-node'
import { LandingSection, FeatureGrid, Feature } from './ui/landing-section'
import { 
  Leaf, 
  ArrowRight, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity,
  TrendingUp,
  Wallet,
  Clock,
  Globe,
  Zap
} from 'lucide-react'

export function DemoPage() {
  return (
    <div className="space-y-8">
      <AppHero
        title={
          <div className="flex justify-center">
            <img 
              src="/arbor-finiance-logo-with-tagline.png"
              alt="Arbor Finance - Simplifying delta-neutral arbitrage"
              className="max-w-full h-auto"
              style={{ maxHeight: '130px' }}
            />
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <Button variant="arbor" size="lg" className="gap-1">
            Launch App <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="arbor-outline" size="lg">
            Read Docs
          </Button>
        </div>
      </AppHero>

      <LandingSection
        title={<h2 style={{marginTop: "-70px"}} className="text-3xl md:text-4xl font-semibold mb-3 text-primary"></h2>}
        subtitle="Arbor streamlines complex arbitrage strategies with powerful tools for both retail and institutional traders."
        background="default"
        align="center"
        narrowContent
        className="arbor-brown-accent py-12"
      >
        <FeatureGrid columns={3}>
          <Feature 
            icon={<BarChart3 className="h-6 w-6" />}
            title="Strategy Optimization"
            description="Fine-tune arbitrage strategies using aggregated pricing and projected arbitrage opportunities."
          />
          <Feature 
            icon={<Wallet className="h-6 w-6" />}
            title="Capital Efficiency"
            description="Automate cross-protocol position offsets, reducing collateral fragmentation."
          />
          <Feature 
            icon={<Globe className="h-6 w-6" />}
            title="Multi-DEX Execution"
            description="Streamline position entry across multiple DEXes from a single interface."
          />
          <Feature 
            icon={<LineChart className="h-6 w-6" />}
            title="Risk Management"
            description="Unified margin system and proactive liquidation alerts to protect your capital."
          />
          <Feature 
            icon={<Zap className="h-6 w-6" />}
            title="Strategy Composition"
            description="Compose parameterized strategies and execute them as a single transaction."
          />
          <Feature 
            icon={<Clock className="h-6 w-6" />}
            title="Execution Speed"
            description="Low-latency access to Solana perps markets across multiple protocols."
          />
        </FeatureGrid>
      </LandingSection>

      <div className="container mx-auto px-4">
        <div className="space-y-8">
          <Heading size="h2" decoration="branch">Dashboard Overview</Heading>
          
          <StatsGrid columns={4}>
            <StatCard
              label="Total Value Locked"
              value="$24.8M"
              change={12.5}
              trend="up"
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label="24h Trading Volume"
              value="$183.2M"
              change={8.3}
              trend="up"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Active Strategies"
              value="1,249"
              change={4.1}
              trend="up"
              icon={<PieChart className="h-5 w-5" />}
            />
            <StatCard
              label="Average APY"
              value="14.3%"
              change={-2.1}
              trend="down"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </StatsGrid>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ArborPanel className="h-full">
                <CardContent>
                  <MarketsProvider>
                    <MarketsOverview />
                  </MarketsProvider>
                </CardContent>
              </ArborPanel>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Your Strategies</CardTitle>
                  <CardDescription>Active delta-neutral positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <StrategyCard
                      title="ETH Funding Arb"
                      description="Long ETH on Drift, Short on Mango"
                      status="active"
                      metrics={[
                        { label: "Position Size", value: "$15,240" },
                        { label: "Current PnL", value: "$324", change: 2.1 },
                        { label: "Est. APY", value: "12.4%" },
                        { label: "Duration", value: "3d 5h" },
                      ]}
                    />
                    
                    <StrategyCard
                      title="SOL Basis Arb"
                      description="Long SOL-PERP, Short SOL Spot"
                      status="active"
                      metrics={[
                        { label: "Position Size", value: "$8,750" },
                        { label: "Current PnL", value: "$112", change: 1.3 },
                        { label: "Est. APY", value: "8.2%" },
                        { label: "Duration", value: "1d 12h" },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mt-12">
            <Heading size="h3">Strategy Composer</Heading>
            <Subheading>Create complex multi-market strategies</Subheading>
            
            <div className="mt-6 p-6 border rounded-lg bg-card">
              <div className="flex justify-center">
                <div className="space-y-8 w-full max-w-3xl">
                  <TreeNode
                    title="SOL Funding Arbitrage"
                    subtitle="Delta-neutral funding rate strategy"
                    variant="primary"
                    active
                    icon={<Leaf className="h-4 w-4" />}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TreeNode
                      title="Long SOL-PERP"
                      subtitle="Drift Protocol"
                      connected="top"
                      connectionLabel="Long Position"
                      variant="accent"
                    >
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span>$5,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leverage:</span>
                          <span>2x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Funding:</span>
                          <span className="text-green-500">+0.02%</span>
                        </div>
                      </div>
                    </TreeNode>
                    
                    <TreeNode
                      title="Short SOL-PERP"
                      subtitle="Mango Markets"
                      connected="top"
                      connectionLabel="Short Hedge"
                      variant="accent"
                    >
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span>$5,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leverage:</span>
                          <span>2x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Funding:</span>
                          <span className="text-red-500">-0.01%</span>
                        </div>
                      </div>
                    </TreeNode>
                  </div>
                  
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
                        <span>0.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stop Loss:</span>
                        <span>2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Take Profit:</span>
                        <span>5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Health Threshold:</span>
                        <span>1.2</span>
                      </div>
                    </div>
                  </TreeNode>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12">
            <div className="mt-6">
              <MarketsProvider>
                <FundingRateAggregator />
              </MarketsProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
