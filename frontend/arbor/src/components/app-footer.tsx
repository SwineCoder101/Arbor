import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Github, Twitter } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="bg-background border-t border-border py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/arbor-finiance-logo.png" 
              alt="Arbor Finance" 
              width={102}
              height={102}
              className="h-8" 
              style={{ objectFit: 'contain' }}
            />
            <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            A delta-neutral arbitrage protocol for Solana perps markets
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/SwineCoder101/Arbor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/SwineCoder101/Arbor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Powered by Solana
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">Terms of Use</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Risk Disclosure</Link>
          <Link href="#" className="hover:text-primary transition-colors">Documentation</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
