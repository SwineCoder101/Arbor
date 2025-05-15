import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ArrowUpRight } from "lucide-react";

const fundingRateVariants = cva("px-2 py-1 text-xs font-medium rounded-full", {
  variants: {
    rate: {
      positive: "bg-green-500/10 text-green-500",
      negative: "bg-red-500/10 text-red-500",
      neutral: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: {
    rate: "neutral",
  },
});

interface FundingRateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  dex: string;
  dexIcon?: React.ReactNode;
  asset: string;
  rate: number;
  annualizedRate?: number;
  nextFunding?: string;
  onClick?: () => void;
}

export function FundingRateCard({
  className,
  dex,
  dexIcon,
  asset,
  rate,
  annualizedRate,
  nextFunding,
  onClick,
  ...props
}: FundingRateCardProps) {
  const rateType = rate > 0 ? "positive" : rate < 0 ? "negative" : "neutral";
  
  return (
    <Card 
      className={cn("overflow-hidden h-full transition-all hover:shadow-md cursor-pointer", className)} 
      onClick={onClick}
      {...props}
    >
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {dexIcon && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background">
              {dexIcon}
            </span>
          )}
          <CardTitle className="text-base">{dex}</CardTitle>
        </div>
        <span className={fundingRateVariants({ rate: rateType })}>
          {rate > 0 ? "+" : ""}{rate}%
        </span>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="text-sm text-muted-foreground">{asset}</div>
        
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
          {annualizedRate !== undefined && (
            <>
              <div className="text-muted-foreground">Ann. APR:</div>
              <div className={cn(
                "text-right font-medium",
                annualizedRate > 0 ? "text-green-500" : 
                annualizedRate < 0 ? "text-red-500" : ""
              )}>
                {annualizedRate > 0 ? "+" : ""}{annualizedRate}%
              </div>
            </>
          )}
          
          {nextFunding && (
            <>
              <div className="text-muted-foreground">Next funding:</div>
              <div className="text-right font-medium">{nextFunding}</div>
            </>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <div className="text-xs text-primary flex items-center gap-1 hover:underline">
            View market
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}