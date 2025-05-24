'use client'

import { useState, useEffect } from 'react'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {PieChart, BarChart3, ArrowRight, Wallet, TrendingUp, History, PanelTop } from 'lucide-react' /*ArrowUpRight*/
import Link from 'next/link'

interface DexInfo {
  name: string
  fundingRate: number
  price?: number
}

interface Order {
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
  activeOrders: Order[]
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

interface DeltaNeutralData {
  deltaNeutralOfferings: Strategy[]
  topArbitrageOpportunities: Strategy[]
  portfolio: {
    summary: PortfolioSummary
    allOrders: Order[]
  }
}

// Dashboard component that displays an overview of the user's portfolio, strategies, and market data
export default function Dashboard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null)
  // const [topStrategies, setTopStrategies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/delta-neutral-perp-offerings.json')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data: DeltaNeutralData = await response.json()
        
        setPortfolioData(data.portfolio.summary)
        // setTopStrategies(data.topArbitrageOpportunities.slice(0, 3))
        setIsLoading(false)
      } catch (err) {
        setError('Error loading data')
        setIsLoading(false)
        console.error(err)
      }
    }

    fetchData()
  }, [])

  // Determine risk class for styling
  // const getRiskClass = (risk: string) => {
  //   switch (risk) {
  //     case 'Low':
  //       return 'bg-emerald-100 text-emerald-800'
  //     case 'Medium':
  //       return 'bg-amber-100 text-amber-800'
  //     case 'High':
  //       return 'bg-rose-100 text-rose-800'
  //     default:
  //       return 'bg-slate-100 text-slate-800'
  //   }
  // }

  if (isLoading) {
    return <div className="p-8">Loading dashboard data...</div>
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Heading size="h3" decoration="branch">Dashboard</Heading>
        <Subheading>Overview of your portfolio and market opportunities</Subheading>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Arbor streamlines complex arbitrage strategies with powerful tools for both retail and institutional traders.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Active Positions</div>
              <div className="text-2xl font-bold text-foreground">{portfolioData?.totalActiveOrders || 0}</div>
            </div>
            <div className="p-2 bg-emerald-100/20 rounded-md">
              <PanelTop className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Across {(portfolioData?.riskExposure?.low || 0) + (portfolioData?.riskExposure?.medium || 0) + (portfolioData?.riskExposure?.high || 0)} strategies
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-foreground">${Number(portfolioData?.totalInvested || 0).toLocaleString()}</div>
            </div>
            <div className="p-2 bg-blue-100/20 rounded-md">
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Allocated to various markets
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Daily Profit Est.</div>
              <div className="text-2xl font-bold text-foreground">${Number(portfolioData?.estimatedDailyProfit || 0).toLocaleString()}</div>
            </div>
            <div className="p-2 bg-violet-100/20 rounded-md">
              <TrendingUp className="h-5 w-5 text-violet-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            ${Number(portfolioData?.estimatedAnnualProfit || 0).toLocaleString()} annualized
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Risk Distribution</div>
              <div className="text-2xl font-bold text-foreground flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> {portfolioData?.riskExposure?.low || 0}
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-500 ml-2"></span> {portfolioData?.riskExposure?.medium || 0}
                <span className="inline-block w-3 h-3 rounded-sm bg-rose-500 ml-2"></span> {portfolioData?.riskExposure?.high || 0}
              </div>
            </div>
            <div className="p-2 bg-amber-100/20 rounded-md">
              <PieChart className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Low / Medium / High risk exposure
          </div>
        </div>
      </div>

      
      {/* Portfolio Performance & Market Activity Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArborPanel>
          <ArborPanelHeader>
            <ArborPanelTitle>Portfolio Performance</ArborPanelTitle>
          </ArborPanelHeader>
          <ArborPanelContent>
            <div className="flex items-center justify-center h-48 bg-muted/10 rounded-md mb-4">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Performance chart would be displayed here</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-muted/5 rounded-md">
                <div className="text-sm font-medium text-muted-foreground">7-Day Returns</div>
                <div className="text-lg font-semibold text-emerald-500">+$71,738.80</div>
              </div>
              <div className="p-3 bg-muted/5 rounded-md">
                <div className="text-sm font-medium text-muted-foreground">Avg. Daily PnL</div>
                <div className="text-lg font-semibold text-emerald-500">+$10,248.40</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/portfolio" passHref>
                <Button variant="link" className="text-xs flex items-center gap-1">
                  View portfolio details
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </ArborPanelContent>
        </ArborPanel>

        <ArborPanel>
          <ArborPanelHeader>
            <ArborPanelTitle>Recent Activity</ArborPanelTitle>
          </ArborPanelHeader>
          <ArborPanelContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="flex items-start p-2 rounded-md hover:bg-muted/5">
                  <div className="p-1.5 bg-muted/20 rounded-full mr-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">
                        {index % 2 === 0 ? 'Long position opened' : 'Short position closed'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {index === 0 ? '2 mins ago' : index === 1 ? '1 hour ago' : index === 2 ? '3 hours ago' : '5 hours ago'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {index === 0 ? 'BTC-PERP on drift' : index === 1 ? 'ETH-PERP on zeta' : index === 2 ? 'SOL-PERP on drift' : 'AVAX-PERP on zeta'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="link" className="text-xs flex items-center gap-1">
                View all activity
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </ArborPanelContent>
        </ArborPanel>
      </div>

      {/* Featured Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ArborPanel variant="gradient" className="p-6">
          <Heading size="h4">Funding Rate Explorer</Heading>
          <p className="text-sm text-muted-foreground mt-2 mb-4">Compare funding rates across DEXs to identify arbitrage opportunities.</p>
          <Link href="/markets" passHref>
            <Button size="sm" variant="outline">
              Explore Markets <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </ArborPanel>

        <ArborPanel variant="gradient" className="p-6">
          <Heading size="h4">Strategy Builder</Heading>
          <p className="text-sm text-muted-foreground mt-2 mb-4">Create and backtest your own delta-neutral perpetual strategies.</p>
          <Button size="sm" variant="outline">
            Build Strategy <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </ArborPanel>

        <ArborPanel variant="gradient" className="p-6">
          <Heading size="h4">Risk Management</Heading>
          <p className="text-sm text-muted-foreground mt-2 mb-4">Analyze and optimize the risk profile of your perpetual strategies.</p>
          <Button size="sm" variant="outline">
            Manage Risk <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </ArborPanel>
      </div>
    </div>
  )
}
