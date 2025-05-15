import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const arborPanelVariants = cva(
  "rounded-lg border shadow-sm overflow-hidden relative",
  {
    variants: {
      variant: {
        default: "bg-card/80 backdrop-blur-sm border-border",
        solid: "bg-card border-border",
        muted: "bg-muted/70 backdrop-blur-sm border-border",
        gradient:
          "bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-border backdrop-blur-sm",
        treePattern: "bg-card border-border arbor-tree-pattern",
      },
      border: {
        default: "border",
        accent: "border-accent/50",
        primary: "border-primary/50",
        none: "border-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      border: "default",
      padding: "default",
    },
  }
);

export interface ArborPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof arborPanelVariants> {
  branchDecoration?: boolean;
}

const ArborPanel = React.forwardRef<HTMLDivElement, ArborPanelProps>(
  (
    {
      className,
      variant,
      border,
      padding,
      branchDecoration = false,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(arborPanelVariants({ variant, border, padding }), className)}
      {...props}
    >
      {children}
      {branchDecoration && (
        <div className="absolute top-0 right-0 w-20 h-16 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-4 w-px h-12 bg-border rotate-45 origin-top"></div>
          <div className="absolute top-4 right-10 w-px h-8 bg-border rotate-30 origin-top"></div>
        </div>
      )}
    </div>
  )
);
ArborPanel.displayName = "ArborPanel";

const ArborPanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 pb-0", className)}
    {...props}
  />
));
ArborPanelHeader.displayName = "ArborPanelHeader";

const ArborPanelTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
ArborPanelTitle.displayName = "ArborPanelTitle";

const ArborPanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ArborPanelDescription.displayName = "ArborPanelDescription";

const ArborPanelContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
ArborPanelContent.displayName = "ArborPanelContent";

const ArborPanelFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
ArborPanelFooter.displayName = "ArborPanelFooter";

export {
  ArborPanel,
  ArborPanelHeader,
  ArborPanelFooter,
  ArborPanelTitle,
  ArborPanelDescription,
  ArborPanelContent,
};