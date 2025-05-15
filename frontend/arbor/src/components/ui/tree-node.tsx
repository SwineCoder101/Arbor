import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const treeNodeVariants = cva(
  "relative group border rounded-lg p-3 transition-all shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        primary: "bg-primary text-primary-foreground border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border-secondary/20",
        accent: "bg-accent text-accent-foreground border-accent/20",
        muted: "bg-muted border-border",
        ghost: "bg-transparent border-dashed border-muted-foreground/30",
      },
      active: {
        true: "ring-2 ring-primary/20",
        false: "",
      },
      connected: {
        top: "before:absolute before:left-1/2 before:-top-4 before:w-px before:h-4 before:bg-border before:-translate-x-1/2",
        bottom: "after:absolute after:left-1/2 after:-bottom-4 after:w-px after:h-4 after:bg-border after:-translate-x-1/2",
        both: "before:absolute before:left-1/2 before:-top-4 before:w-px before:h-4 before:bg-border before:-translate-x-1/2 after:absolute after:left-1/2 after:-bottom-4 after:w-px after:h-4 after:bg-border after:-translate-x-1/2",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      active: false,
      connected: "none",
    },
  }
);

interface TreeNodeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof treeNodeVariants> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  connectionLabel?: string;
}

export function TreeNode({
  className,
  variant,
  active,
  connected,
  title,
  subtitle,
  icon,
  actions,
  connectionLabel,
  children,
  ...props
}: TreeNodeProps) {
  return (
    <div className="relative">
      {connectionLabel && connected && (connected === "top" || connected === "both") && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1 text-xs text-muted-foreground bg-background z-10">
          {connectionLabel}
        </span>
      )}
      <div
        className={cn(treeNodeVariants({ variant, active, connected }), className)}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="shrink-0 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">{title}</div>
              {subtitle && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {actions && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {actions}
            </div>
          )}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}