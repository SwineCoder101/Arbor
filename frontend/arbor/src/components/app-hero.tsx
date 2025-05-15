import React from 'react'
import { cn } from '@/lib/utils'
import { Leaf } from 'lucide-react'

interface AppHeroProps {
  children?: React.ReactNode
  title?: React.ReactNode
  align?: 'center' | 'left'
  pattern?: boolean
  decorative?: boolean
}

export function AppHero({
  children,
  title,
  align = 'center',
  pattern = false,
  decorative = true,
}: AppHeroProps) {
  return (
    <div className={cn(
      "relative py-12 md:py-20",
      pattern && "arbor-grid-pattern",
      align === 'center' ? "text-center" : "text-left"
    )}>
      {/* Decorative elements */}
      {decorative && (
        <>
          <div className="absolute top-0 left-[10%] opacity-10 pointer-events-none">
            <Leaf className="h-16 w-16 text-primary transform -rotate-15" />
          </div>
          <div className="absolute bottom-0 right-[10%] opacity-10 pointer-events-none">
            <Leaf className="h-12 w-12 text-secondary transform rotate-45" />
          </div>
        </>
      )}

      <div className={cn(
        "container mx-auto px-4",
        align === 'center' ? "flex flex-col items-center" : ""
      )}>
        <div className={cn(
          "max-w-3xl",
          align === 'center' ? "mx-auto" : ""
        )}>
          {typeof title === 'string' ? (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary">
              {title}
            </h1>
          ) : title}
          
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
      
      {/* Decorative divider */}
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-32 overflow-hidden">
        <div className="arbor-branch-divider w-32 mx-auto"></div>
      </div>
    </div>
  )
}
