import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { MoreHorizontal } from "lucide-react";

interface PositionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  marketIcon?: React.ReactNode;
  position: "long" | "short";
  size: string | number;
  leverage?: number;
  entryPrice: string | number;
  markPrice: string | number;
  pnl: {
    value: string | number;
    percentage: number;
  };
  liquidationPrice?: string | number;
  actions?: React.ReactNode;
}

export function PositionCard({
  className,
  title,
  subtitle,
  marketIcon,
  position,
  size,
  leverage,
  entryPrice,
  markPrice,
  pnl,
  liquidationPrice,
  actions,
  ...props
}: PositionCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          {marketIcon && (
            <div className="h-6 w-6 rounded-full bg-background flex items-center justify-center">
              {marketIcon}
            </div>
          )}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full",
              position === "long" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}
          >
            {position === "long" ? "Long" : "Short"}
            {leverage && `  ${leverage}x`}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="text-muted-foreground">Size</div>
          <div className="text-right font-medium">{size}</div>
          
          <div className="text-muted-foreground">Entry Price</div>
          <div className="text-right font-medium">{entryPrice}</div>
          
          <div className="text-muted-foreground">Mark Price</div>
          <div className="text-right font-medium">{markPrice}</div>
          
          {liquidationPrice && (
            <>
              <div className="text-muted-foreground">Liquidation</div>
              <div className="text-right font-medium">{liquidationPrice}</div>
            </>
          )}
          
          <div className="text-muted-foreground">PnL</div>
          <div className={cn(
            "text-right font-medium flex flex-col items-end",
            pnl.percentage > 0 ? "text-green-500" : "text-red-500"
          )}>
            <span>{pnl.value}</span>
            <span className="text-xs">
              {pnl.percentage > 0 && "+"}
              {pnl.percentage}%
            </span>
          </div>
        </div>
        
        {actions && (
          <div className="mt-4 flex items-center justify-end gap-2">
            {actions}
          </div>
        )}
        
        {!actions && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant={position === "long" ? "destructive" : "default"} size="sm">
              Close
            </Button>
            <Button variant={position === "long" ? "outline" : "arbor-outline"} size="sm">
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}