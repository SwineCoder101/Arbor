import React from 'react'

export function AppFooter() {
  return (
    <footer className="text-center p-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 text-xs">
      Arbor © {new Date().getFullYear()} - A perpetual DEX aggregator on{' '}
      <a
        className="link hover:text-neutral-500 dark:hover:text-white"
        href="https://solana.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Solana
      </a>
    </footer>
  )
}
