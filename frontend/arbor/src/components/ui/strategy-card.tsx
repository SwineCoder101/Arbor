import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface StrategyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  metrics?: {
    label: string;
    value: string | number;
    change?: number;
  }[];
  status?: "active" | "inactive" | "pending";
  progress?: number;
  actions?: React.ReactNode;
}

export function StrategyCard({
  className,
  title,
  description,
  metrics,
  status,
  progress,
  actions,
  ...props
}: StrategyCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden", className)} {...props}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {status && (
            <div className={cn(
              "px-2 py-1 text-xs rounded-full font-medium",
              status === "active" && "bg-primary/10 text-primary",
              status === "inactive" && "bg-muted text-muted-foreground",
              status === "pending" && "bg-accent/10 text-accent-foreground"
            )}>
              {status === "active" && "Active"}
              {status === "inactive" && "Inactive"}
              {status === "pending" && "Pending"}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2 mb-4">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-medium">{metric.value}</p>
                  {metric.change !== undefined && (
                    <span className={cn(
                      "text-xs font-medium flex items-center",
                      metric.change > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {metric.change > 0 ? "+" : ""}{metric.change}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {progress !== undefined && (
          <div className="space-y-1 mt-4 mb-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {actions && (
          <div className="flex items-center justify-end gap-2 mt-4">
            {actions}
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
