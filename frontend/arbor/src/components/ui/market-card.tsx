import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ArrowUpRight } from "lucide-react";
import Image from 'next/image'

const marketCardVariants = cva("overflow-hidden transition-all", {
  variants: {
    variant: {
      default: "bg-card border border-border",
      drift: "bg-gradient-to-r from-[#FF9F0A]/5 to-[#FF9F0A]/10 border border-[#FF9F0A]/20",
      mango: "bg-gradient-to-r from-[#E54033]/5 to-[#E54033]/10 border border-[#E54033]/20", 
      zeta: "bg-gradient-to-r from-[#5551FF]/5 to-[#5551FF]/10 border border-[#5551FF]/20",
      jupiter: "bg-gradient-to-r from-[#FF6978]/5 to-[#FF6978]/10 border border-[#FF6978]/20",
      orderly: "bg-gradient-to-r from-[#4169E1]/5 to-[#4169E1]/10 border border-[#4169E1]/20",
    },
    hover: {
      true: "hover:shadow-md cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    hover: true,
  },
});

export interface MarketCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof marketCardVariants> {
  name: string;
  icon?: React.ReactNode;
  marketData?: {
    label: string;
    value: string | number;
    change?: number;
  }[];
  action?: React.ReactNode;
}

export function MarketCard({
  className,
  variant,
  hover,
  name,
  icon,
  marketData,
  action,
  ...props
}: MarketCardProps) {
  // Market colors mapping
  const marketColors = {
    drift: "#FF9F0A",
    mango: "#E54033",
    zeta: "#5551FF",
    jupiter: "#FF6978",
    orderly: "#4169E1",
    default: "var(--primary)",
  };

  const accentColor = variant && variant !== "default" 
    ? marketColors[variant as keyof typeof marketColors] 
    : marketColors.default;

  return (
    <Card 
      className={cn(marketCardVariants({ variant, hover }), className)} 
      {...props}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80">
              {icon}
            </span>
          )}
          <CardTitle 
            className="text-base font-medium"
            style={{ color: accentColor }}
          >
            {name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {marketData && marketData.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {marketData.map((item, index) => (
              <React.Fragment key={index}>
                <div className="text-muted-foreground">{item.label}</div>
                <div className="text-right font-medium flex flex-col items-end">
                  <span>{item.value}</span>
                  {item.change !== undefined && (
                    <span 
                      className={cn(
                        "text-xs",
                        item.change > 0 ? "text-green-500" : 
                        item.change < 0 ? "text-red-500" : 
                        "text-muted-foreground"
                      )}
                    >
                      {item.change > 0 ? "+" : ""}
                      {item.change}%
                    </span>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
        
        {action ? (
          <div className="mt-4 flex justify-end">
            {action}
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <div 
              className="text-xs flex items-center gap-1 hover:underline transition-colors"
              style={{ color: accentColor }}
            >
              View market
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketLogo({ 
  market, 
  size = "md",
  className,
  ...props
}: { 
  market: "drift" | "mango" | "zeta" | "jupiter" | "orderly" | "solana"
  size?: "sm" | "md" | "lg"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10",
  };
  
  // Map market names to their logo files
  const getLogoSrc = () => {
    switch (market) {
      case "drift":
        return "/perp-logos/drift-logo.png";
      case "mango":
        return "/perp-logos/mango-markets-logo.png";
      case "zeta":
        return "/perp-logos/zeta-logo.png";
      case "jupiter":
        return "/perp-logos/jupiter-logo.png";
      case "orderly":
        return "/perp-logos/orderly-logo.png";
      case "solana":
        // Fallback to SVG for Solana since we don't have an image
        return null;
      default:
        return null;
    }
  };
  
  const logoSrc = getLogoSrc();
  
  // Fallback to SVG for Solana
  const SolanaSVG = () => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M26 9.5L6 21.5M6 10.5L26 22.5M6 16L26 16" stroke="#9945FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden",
        market === "solana" ? "bg-white" : "", // Only add white background for Solana SVG
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {logoSrc ? (
        <Image 
          src={logoSrc} 
          alt={`${market} logo`} 
          width={48}
          height={48}
          className={`${
            size === 'lg' ? 'h-12 w-12' : 
            size === 'md' ? 'h-8 w-8' : 
            'h-6 w-6'
          } rounded-full object-cover`}
        />
      ) : (
        <SolanaSVG />
      )}
    </div>
  );
}