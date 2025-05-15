import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { TrendingDown, TrendingUp } from "lucide-react";

const dataCardVariants = cva(
  "rounded-lg border shadow-sm overflow-hidden p-4",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        filled: "bg-muted border-border",
        gradient: "bg-gradient-to-br from-card via-card to-card/60 border-border",
        outline: "bg-transparent border-border",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface DataCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  change?: number;
  trend?: "up" | "down" | "neutral";
  footer?: React.ReactNode;
}

export function DataCard({
  className,
  variant,
  size,
  title,
  value,
  subtitle,
  icon,
  change,
  trend,
  footer,
  ...props
}: DataCardProps) {
  return (
    <div
      className={cn(dataCardVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold">{value}</p>
            {change !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  !trend && "text-muted-foreground"
                )}
              >
                {change > 0 && "+"}
                {change}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        )}
        {!icon && trend && (
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              trend === "up" && "bg-green-500/10 text-green-500",
              trend === "down" && "bg-red-500/10 text-red-500"
            )}
          >
            {trend === "up" && <TrendingUp className="h-5 w-5" />}
            {trend === "down" && <TrendingDown className="h-5 w-5" />}
          </div>
        )}
      </div>
      {footer && <div className="mt-3 pt-3 border-t text-xs">{footer}</div>}
    </div>
  );
}