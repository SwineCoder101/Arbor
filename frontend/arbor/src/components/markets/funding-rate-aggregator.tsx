'use client'

import React, { useState } from 'react'
import { useMarkets } from './markets-provider'
import { FundingRateCard } from '@/components/ui/funding-rate-card'
import { MarketLogo } from '@/components/ui/market-card'
import { Tabs, Tab } from '@/components/ui/tabs'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Heading, Subheading } from '@/components/ui/headings'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Search, FilterIcon, ArrowDownUp } from 'lucide-react'

export function FundingRateAggregator() {
  const { markets, isLoading } = useMarkets()
  const [selectedAsset, setSelectedAsset] = useState('BTC-PERP')
  const [showModal, setShowModal] = useState(false)

  if (isLoading) {
    return <div>Loading funding rates...</div>
  }

  // Filter to only perp markets that have funding rates
  const perpMarkets = markets.filter(market => market.fundingRate !== 0)

  // Sample assets for demonstration
  const assets = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'ARB-PERP', 'SUI-PERP']

  // Get all markets for selected asset
  const getMarketsForAsset = (asset: string) => {
    // In a real app, you would filter by asset
    // For demo purposes, just return all perp markets
    return perpMarkets
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
            />
          </div>
          
          <Button variant="outline" size="sm" className="gap-1.5">
            <FilterIcon className="h-3.5 w-3.5" /> Filter
          </Button>
          
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowDownUp className="h-3.5 w-3.5" /> Sort
          </Button>
        </div>
      </div>
      
      <Tabs variant="card" defaultValue={selectedAsset}>
        {assets.map(asset => (
          <Tab key={asset} value={asset} onClick={() => setSelectedAsset(asset)}>
            {asset}
          </Tab>
        ))}
        
        <ArborPanel className="mt-6">
          <ArborPanelHeader>
            <ArborPanelTitle>{selectedAsset} Funding Rates</ArborPanelTitle>
          </ArborPanelHeader>
          
          <ArborPanelContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getMarketsForAsset(selectedAsset).map(market => (
                <FundingRateCard
                  key={market.name}
                  dex={market.displayName}
                  dexIcon={<MarketLogo market={market.name} size="sm" />}
                  asset={selectedAsset}
                  rate={market.fundingRate * 100}
                  annualizedRate={market.fundingRateAnnualized}
                  nextFunding={market.nextFundingTime}
                  onClick={() => setShowModal(true)}
                />
              ))}
            </div>
          </ArborPanelContent>
        </ArborPanel>
      </Tabs>
      
      <ArborPanel 
        variant="gradient" 
        className="mt-8 p-6"
        branchDecoration
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Funding Rate Arbitrage Strategy</h3>
            <p className="text-muted-foreground">
              Take advantage of rate differentials between markets to generate delta-neutral yields
            </p>
          </div>
          <Button variant="arbor">Create Strategy</Button>
        </div>
      </ArborPanel>
      
      <Modal open={showModal} onOpenChange={setShowModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Market Details</ModalTitle>
            <ModalDescription>View detailed funding and market information</ModalDescription>
          </ModalHeader>
          <div className="p-6">
            <p>Detailed market information would appear here.</p>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}