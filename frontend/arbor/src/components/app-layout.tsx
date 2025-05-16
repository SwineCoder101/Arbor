'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import React from 'react'
import { AppFooter } from '@/components/app-footer'
import { ClusterChecker } from '@/components/cluster/cluster-ui'
import { AccountChecker } from '@/components/account/account-ui'

export function AppLayout({
  children,
  links,
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen bg-background  arbor-green-burst">
        {/* Decorative background pattern */}
        <div className="fixed inset-0 z-[-1] arbor-grid-pattern opacity-50 pointer-events-none" />
        
        <AppHeader links={links} />
        
        <main className="flex-grow container mx-auto p-4 pt-6 lg:p-6 relative">
          {/* Top decorative branch */}
          <div className="absolute top-0 right-[15%] w-32 h-12 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-0 right-0 w-px h-12 bg-primary rotate-45 origin-top"></div>
            <div className="absolute top-0 right-8 w-px h-8 bg-primary rotate-30 origin-top"></div>
            <div className="absolute top-0 right-16 w-px h-6 bg-primary rotate-15 origin-top"></div>
          </div>
          
          <ClusterChecker>
            <AccountChecker />
          </ClusterChecker>
          
          {children}
        </main>
        
        <AppFooter />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
