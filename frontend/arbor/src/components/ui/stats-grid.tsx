import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statsGridVariants = cva("grid gap-4", {
  variants: {
    columns: {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: {
    columns: 4,
  },
});

interface StatsGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsGridVariants> {}

export function StatsGrid({
  className,
  columns,
  children,
  ...props
}: StatsGridProps) {
  return (
    <div className={cn(statsGridVariants({ columns }), className)} {...props}>
      {children}
    </div>
  );
}

const statCardVariants = cva("p-6 rounded-lg flex flex-col", {
  variants: {
    variant: {
      default: "bg-card border border-border",
      gradient: "bg-gradient-to-br from-primary/5 to-accent/10 border border-border",
      outline: "border border-border",
      filled: "bg-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
}

export function StatCard({
  className,
  variant,
  label,
  value,
  change,
  trend,
  icon,
  description,
  ...props
}: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)} {...props}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        {change !== undefined && (
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" ? "text-green-500" : 
              trend === "down" ? "text-red-500" : 
              "text-muted-foreground"
            )}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}