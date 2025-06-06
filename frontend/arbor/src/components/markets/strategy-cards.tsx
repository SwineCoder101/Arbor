'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Strategy } from '@/types/strategy';

interface StrategyCardsProps {
  filteredStrategies: Strategy[];
  getStrategyName: (strategy: Strategy) => string;
  calculatePositionValueInUSDC: (strategy: Strategy) => string;
}

export function StrategyCards({ filteredStrategies, getStrategyName, calculatePositionValueInUSDC }: StrategyCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden"> {/* Only visible on mobile */} 
      {filteredStrategies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No strategies match your search criteria. Try adjusting your search criteria.
        </div>
      ) : (
        filteredStrategies.map((strategy) => {
          const longFundingRate = strategy.longDex.fundingRate / 10000;
          const shortFundingRate = strategy.shortDex.fundingRate / 10000;
          
          return (
            <div 
              key={getStrategyName(strategy)} 
              className="bg-card group flex flex-col border border-border mb-4 p-4 rounded-lg shadow-sm"
            >
              {/* Strategy Name */}
              <div className="font-medium h-full pb-3 mb-3 border-b border-border">
                <div className="flex items-start h-full">
                  <div className="p-1.5 rounded-md bg-muted/20 mr-2.5 flex items-center justify-center min-w-[36px]">
                    <span className="text-xs font-bold uppercase">{strategy.asset.split('-')[0]}</span>
                  </div>
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="font-medium">{getStrategyName(strategy)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {strategy.strategyType}
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
              </div>
              
              {/* DEX Details */}
              <div className="pt-4">
                <div className="font-semibold text-sm text-muted-foreground text-center underline ">DEX Details</div>
                <div className="grid grid-cols-2 h-full">
                  <div className="p-3 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Long DEX</div>
                    <div className="uppercase tracking-wider text-xs font-medium mt-1">{strategy.longDex.name}</div>
                  </div>
                  <div className="p-3 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Short DEX</div>
                    <div className="uppercase tracking-wider text-xs font-medium mt-1">{strategy.shortDex.name}</div>
                  </div>
                </div>
              </div>
              
              {/* Position Info */}
              <div className="pt-4">
                <div className="font-semibold text-sm text-muted-foreground text-center underline pt-5 mt-2 border-t border-border">Position Info</div>
                <div className="grid grid-cols-2 h-full">
                  <div className="p-3 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Size</div>
                    <div className="text-xs mt-1 font-semibold">
                      {strategy.recommendedSize} {strategy.asset.split('-')[0]}
                    </div>
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
              </div>
              
              {/* Financial Data */}
              <div className="pt-4">
                <div className="font-semibold text-sm text-muted-foreground text-center underline pt-5 mt-2 border-t border-border">Financial Data</div>
                <div className="grid grid-cols-2 h-full">
                  <div className="p-3 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Daily Profit</div>
                    <div className="text-xs mt-1 font-semibold text-emerald-500">
                      ${strategy.estimatedDailyProfit} USDC
                    </div>
                  </div>
                  <div className="p-3 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Value</div>
                    <div className="text-xs mt-1 font-semibold">
                      ${calculatePositionValueInUSDC(strategy)} USDC
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Funding Rates */}
              <div className="pt-4">
                <div className="font-semibold text-sm text-muted-foreground text-center underline pt-5 mt-2 border-t border-border">Funding Rates</div>
                <div className="grid grid-cols-2 h-full">
                  <div className="p-2 flex flex-col items-center justify-center">
                    <div className="font-medium text-xs">Long</div>
                    <div className={`text-xs mt-1 ${longFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                      {longFundingRate >= 0 ? '+' : ''}{longFundingRate.toFixed(6)}%
                    </div>
                  </div>
                  <div className="p-2 flex flex-col items-center justify-center">
                    <div className={`text-xs mt-1 ${shortFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                      {shortFundingRate >= 0 ? '+' : ''}{shortFundingRate.toFixed(6)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="pt-4">
                <div className="font-semibold text-sm text-muted-foreground text-center underline pt-5 mt-2 border-t border-border"></div>
                <div className="fbex flex-col gap-1.5 items-center justify-center h-full">
                  <Link href={`/strategies/${strategy.asset}`}>
                    <Button variant="arbor-outline" size="sm" className="w-full h-8 text-xs">
                      View Strategy <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
} 