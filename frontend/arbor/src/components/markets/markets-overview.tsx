'use client'

import React from 'react'
import Link from "next/link"
import { useMarkets, MarketName } from './markets-provider'
import { MarketCard, MarketLogo } from '@/components/ui/market-card'
import { Button } from '@/components/ui/button'
import { Tabs, Tab } from '@/components/ui/tabs'
import { Heading, Subheading } from '@/components/ui/headings'
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'

export function MarketsOverview() {
  const { markets, isLoading, error } = useMarkets()

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading markets data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error loading markets: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Heading size="h3" decoration="branch">Markets Overview</Heading>
          <Subheading>Compare perps markets across protocols</Subheading>
        </div>
        <Link href="/markets">
          <Button variant="arbor-outline" size="sm" className="w-auto gap-1">
            View all markets <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <Tab value="all">All Markets</Tab>
        <Tab value="perps">Perpetuals</Tab>
        <Tab value="funding">Funding</Tab>
        <Tab value="volume">Volume</Tab>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {markets.map((market) => (
            <MarketCard
              key={market.name}
              variant={market.name as MarketName}
              name={market.displayName}
              icon={<MarketLogo market={market.name} />}
              marketData={[
                {
                  label: '24h Volume',
                  value: formatCurrency(market.volumeLast24h),
                  change: market.volumeChange,
                },
                {
                  label: 'Open Interest',
                  value: market.openInterest ? formatCurrency(market.openInterest) : 'N/A',
                  change: market.openInterestChange,
                },
                {
                  label: 'Funding Rate',
                  value: market.fundingRate ? `${(market.fundingRate * 100).toFixed(4)}%` : 'N/A',
                },
                {
                  label: 'Ann. APR',
                  value: market.fundingRateAnnualized ? `${market.fundingRateAnnualized.toFixed(2)}%` : 'N/A',
                },
              ]}
              action={
                <Button variant="arbor-ghost" size="sm" className="gap-1">
                  Trade now
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              }
            />
          ))}
        </div>
      </Tabs>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="arbor-panel p-6">
          <h3 className="text-lg font-medium mb-4">Top Funding Opportunities</h3>
          <div className="space-y-3">
            {markets
              .filter(m => m.fundingRate !== 0)
              .sort((a, b) => Math.abs(b.fundingRateAnnualized) - Math.abs(a.fundingRateAnnualized))
              .slice(0, 3)
              .map((market) => (
                <div key={market.name} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <MarketLogo market={market.name} size="sm" />
                    <div>
                      <p className="font-medium">{market.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Next funding: {market.nextFundingTime || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${market.fundingRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {market.fundingRate > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="font-medium">{market.fundingRateAnnualized.toFixed(2)}% APR</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(market.fundingRate * 100).toFixed(4)}% per funding
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="arbor-panel p-6">
          <h3 className="text-lg font-medium mb-4">Volume Leaders (24h)</h3>
          <div className="space-y-3">
            {markets
              .sort((a, b) => b.volumeLast24h - a.volumeLast24h)
              .slice(0, 3)
              .map((market) => (
                <div key={market.name} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <MarketLogo market={market.name} size="sm" />
                    <div>
                      <p className="font-medium">{market.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Change: 
                        <span className={market.volumeChange > 0 ? 'text-green-500' : 'text-red-500'}>
                          {' '}{market.volumeChange > 0 ? '+' : ''}{market.volumeChange}%
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(market.volumeLast24h)}</p>
                    <p className="text-xs text-muted-foreground">
                      {market.openInterest ? `OI: ${formatCurrency(market.openInterest)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format currency
function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`
  } else {
    return `$${value.toFixed(2)}`
  }
}
