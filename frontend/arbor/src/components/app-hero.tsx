import React from 'react'

export function AppHero({
  children,
  subtitle,
  title,
}: {
  children?: React.ReactNode
  subtitle?: React.ReactNode
  title?: React.ReactNode
}) {
  return (
    <div className="flex flex-row justify-center py-[16px] md:py-[64px]">
      <div className="text-center">
        <div className="max-w-3xl">
          {typeof title === 'string' ? <h1 className="text-5xl font-bold text-green-600 dark:text-green-400">{title}</h1> : title}
          {typeof subtitle === 'string' ? <p className="pt-4 md:py-6 text-lg">{subtitle}</p> : subtitle}
          {children}
        </div>
      </div>
    </div>
  )
}
