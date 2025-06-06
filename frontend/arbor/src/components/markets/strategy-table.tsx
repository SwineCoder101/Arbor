'use client'

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Strategy } from '@/types/strategy';

interface StrategyTableProps {
  filteredStrategies: Strategy[];
  getStrategyName: (strategy: Strategy) => string;
  calculatePositionValueInUSDC: (strategy: Strategy) => string;
}

export function StrategyTable({ filteredStrategies, getStrategyName, calculatePositionValueInUSDC }: StrategyTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/10">
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
                No strategies match your search criteria. Try adjusting your search criteria.
              </TableCell>
            </TableRow>
          ) : (
            filteredStrategies.map((strategy) => {
              const longFundingRate = strategy.longDex.fundingRate / 10000;
              const shortFundingRate = strategy.shortDex.fundingRate / 10000;
              
              return (
                <TableRow 
                  key={getStrategyName(strategy)} 
                  className="hover:bg-muted/5 group"
                >
                  <TableCell className="sticky left-0 bg-background z-10 group-hover:bg-muted/5 font-medium h-full p-3">
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
                  </TableCell>
                  
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
                  
                  <TableCell className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-border h-full">
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
                  </TableCell>
                  
                  <TableCell className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-border h-full">
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
                  </TableCell>
                  
                  <TableCell className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-border h-full">
                      <div className="p-2 flex flex-col items-center justify-center">
                        <div className="font-medium text-xs">Long</div>
                        <div className={`text-xs mt-1 ${longFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                          {longFundingRate >= 0 ? '+' : ''}{longFundingRate.toFixed(6)}%
                        </div>
                      </div>
                      <div className="p-2 flex flex-col items-center justify-center">
                        <div className="font-medium text-xs">Short</div>
                        <div className={`text-xs mt-1 ${shortFundingRate >= 0 ? 'text-emerald-500' : 'text-rose-400'} font-semibold`}>
                          {shortFundingRate >= 0 ? '+' : ''}{shortFundingRate.toFixed(6)}%
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="p-3">
                    <div className="flex flex-col gap-1.5 items-center justify-center h-full">
                      <Link href={`/strategies/${strategy.asset}`}>
                        <Button variant="arbor-outline" size="sm" className="w-full h-8 text-xs">
                          View Strategy <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
} 