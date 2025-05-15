import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Leaf } from "lucide-react";

const landingSectionVariants = cva("py-16 md:py-24", {
  variants: {
    background: {
      default: "bg-background",
      muted: "bg-muted/30",
      gradient: "bg-gradient-to-b from-background to-muted/30",
      pattern: "arbor-grid-pattern",
    },
    border: {
      none: "",
      top: "border-t border-border",
      bottom: "border-b border-border",
      both: "border-t border-b border-border",
    },
  },
  defaultVariants: {
    background: "default",
    border: "none",
  },
});

interface LandingSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof landingSectionVariants> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  narrowContent?: boolean;
}

export function LandingSection({
  className,
  background,
  border,
  title,
  subtitle,
  align = "center",
  narrowContent = false,
  children,
  ...props
}: LandingSectionProps) {
  return (
    <section
      className={cn(landingSectionVariants({ background, border }), className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex flex-col",
            narrowContent && "max-w-3xl mx-auto",
            align === "center" && "items-center text-center"
          )}
        >
          {title && (
            <div className="mb-10">
              {typeof title === "string" ? (
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                  {title}
                </h2>
              ) : (
                title
              )}
              {typeof subtitle === "string" ? (
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {subtitle}
                </p>
              ) : (
                subtitle
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({
  className,
  children,
  columns = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-8",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "md:grid-cols-2 lg:grid-cols-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface FeatureProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export function Feature({
  className,
  icon,
  title,
  description,
  ...props
}: FeatureProps) {
  return (
    <div
      className={cn(
        "flex flex-col p-6 bg-card/80 backdrop-blur-sm border border-border rounded-lg transition-all hover:shadow-md hover:border-primary/20",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 text-primary flex items-center justify-center relative">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-medium mb-3 text-primary">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}