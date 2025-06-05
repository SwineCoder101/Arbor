import { AppHero } from '@/components/app-hero'

const links: { label: string; href: string }[] = [
  { label: 'Drift Protocol', href: 'https://www.drift.trade/' },
  { label: 'Jupiter Exchange', href: 'https://jup.ag/' },
  { label: 'Orderly Network', href: 'https://orderly.network/' },
  { label: 'Mango Markets', href: 'https://mango.markets/' },
  { label: 'Solana', href: 'https://solana.com/' },
]

export function DashboardFeature() {
  return (
    <div>
      <AppHero 
        title="Arbor" 
      >
        <p className="mt-4 text-lg text-muted-foreground">
          A perpetual DEX aggregator aimed to facilitate arbitrage opportunities across Solana
        </p>
      </AppHero>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg dark:border-neutral-700 hover:shadow-md transition">
              <h3 className="text-xl font-medium mb-2">Multi-DEX Order Execution</h3>
              <p className="text-sm">Execute positions across multiple DEXs with a single order, optimizing for best execution.</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-neutral-700 hover:shadow-md transition">
              <h3 className="text-xl font-medium mb-2">Real-Time Funding Rate Aggregation</h3>
              <p className="text-sm">Track and compare funding rates across multiple DEXs to identify arbitrage opportunities.</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-neutral-700 hover:shadow-md transition">
              <h3 className="text-xl font-medium mb-2">One-Click Hedged Positions</h3>
              <p className="text-sm">Create delta-neutral positions across protocols with a single click.</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-neutral-700 hover:shadow-md transition">
              <h3 className="text-xl font-medium mb-2">Unified Margin Management</h3>
              <p className="text-sm">Manage collateral from a single pool with integrated position monitoring.</p>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold mb-4">Supported Protocols</h2>
          <p className="mb-4">Maximize profits by leveraging arbitrage across these protocols:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
