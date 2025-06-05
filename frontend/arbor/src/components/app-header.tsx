'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
// import { ThemeSelect } from '@/components/theme-select'
import { ClusterButton, WalletButton } from '@/components/solana/solana-provider'

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  const shouldHideNav = pathname === '/location-not-supported'

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center gap-6">
          <Link 
            className="flex items-center transition-colors" 
            href="/"
          >
            <Image 
              src="/arbor-finiance-logo.png" 
              alt="Arbor Finance" 
              width={118}
              height={118}
              className="h-12" 
              style={{ objectFit: 'contain' }}
            />
          </Link>
          
          {!shouldHideNav && (
            <nav className="hidden md:block">
              <ul className="flex gap-6">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`relative py-2 text-sm font-medium transition-colors hover:text-primary
                        ${isActive(path) 
                          ? 'text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full' 
                          : 'text-foreground/80'
                        }`}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {!shouldHideNav && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}

        {!shouldHideNav && (
          <div className="hidden md:flex items-center gap-4">
            <WalletButton size="sm" />
            <ClusterButton size="sm" />
            {/* <ThemeSelect /> */}
          </div>
        )}

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-background/95 backdrop-blur-md z-40 border-t border-border">
            <div className="flex flex-col p-4 gap-6">
              <nav>
                <ul className="flex flex-col gap-4">
                  {links.map(({ label, path }) => (
                    <li key={path}>
                      <Link
                        className={`block py-2.5 text-base font-medium transition-colors hover:text-primary
                          ${isActive(path) ? 'text-primary' : 'text-foreground/80'}`}
                        href={path}
                        onClick={() => setShowMenu(false)}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="flex flex-col gap-4 pt-2 border-t border-border">
                <WalletButton />
                <ClusterButton />
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeSelect />
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
