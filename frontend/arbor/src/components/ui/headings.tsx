import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const headingBaseClasses = "font-medium tracking-tight";

const headingVariants = cva(headingBaseClasses, {
  variants: {
    size: {
      h1: "text-4xl md:text-5xl lg:text-6xl",
      h2: "text-3xl md:text-4xl",
      h3: "text-2xl md:text-3xl",
      h4: "text-xl md:text-2xl",
      h5: "text-lg md:text-xl",
      h6: "text-base md:text-lg",
    },
    variant: {
      default: "",
      gradient: "text-transparent bg-clip-text bg-gradient-to-r from-[#7d5f54] to-[#7c9473]",
      muted: "text-muted-foreground",
      subtle: "text-accent-foreground",
    },
    weight: {
      default: "font-medium",
      light: "font-light",
      normal: "font-normal",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    decoration: {
      none: "",
      underline: "underline underline-offset-4",
      branch: "relative pb-3",
    },
  },
  defaultVariants: {
    size: "h2",
    variant: "default",
    weight: "default",
    decoration: "none",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}

export function Heading({
  className,
  size,
  variant,
  weight,
  decoration,
  as: Tag = "h2",
  children,
  ...props
}: HeadingProps) {
  return (
    <div className="relative">
      <Tag
        className={cn(
          headingVariants({ size, variant, weight, decoration }),
          className
        )}
        {...props}
      >
        {children}
      </Tag>
      {decoration === "branch" && (
        <div className="absolute bottom-0 left-0 w-20 h-1 overflow-hidden">
          <div className="absolute arbor-branch-divider w-16"></div>
        </div>
      )}
    </div>
  );
}

export interface SubheadingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  muted?: boolean;
}

export function Subheading({
  className,
  children,
  muted = true,
  ...props
}: SubheadingProps) {
  return (
    <p
      className={cn(
        "text-lg",
        muted ? "text-muted-foreground" : "text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}