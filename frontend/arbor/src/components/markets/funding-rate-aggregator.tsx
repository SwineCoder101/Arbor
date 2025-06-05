'use client'

import React, { useState } from 'react'
import { useMarkets } from './markets-provider'
import { FundingRateCard } from '@/components/ui/funding-rate-card'
import { MarketLogo } from '@/components/ui/market-card'
import { Tabs, Tab } from '@/components/ui/tabs'
import { ArborPanel, ArborPanelHeader, ArborPanelTitle, ArborPanelContent } from '@/components/ui/arbor-panel'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { FundingRateTable } from './funding-rate-table'

export function FundingRateAggregator() {
  const { markets, isLoading } = useMarkets()
  const [selectedAsset, setSelectedAsset] = useState('BTC-PERP')
  const [showModal, setShowModal] = useState(false)
  const [viewMode] = useState<'table' | 'cards'>('table')

  if (isLoading) {
    return <div>Loading funding rates...</div>
  }

  // Filter to only perp markets that have funding rates
  const perpMarkets = markets.filter(market => market.fundingRate !== 0)

  // Sample assets for demonstration
  const assets = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'ARB-PERP', 'SUI-PERP']

  // Get all markets for selected asset
  const getMarketsForAsset = () => {
    // In a real app, you would filter by asset
    // For demo purposes, just return all perp markets
    return perpMarkets
  }

  return (
    <div className="space-y-6">
      
      {viewMode === 'cards' ? (
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
                {getMarketsForAsset().map(market => (
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
      ) : (
        <FundingRateTable />
      )}
      
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
