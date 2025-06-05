'use client'

import { assertIsAddress } from 'gill'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { AccountBalance, AccountButtons, AccountTokens, AccountTransactions } from './account-ui'
import { AppHero } from '../app-hero'

export default function AccountDetailFeature() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address || typeof params.address !== 'string') {
      return
    }
    assertIsAddress(params.address)
    return params.address
  }, [params])
  if (!address) {
    return <div>Error loading account</div>
  }

  return (
    <div>
      <AppHero
        title={<AccountBalance address={address} />}
      >
        <div className="my-4">
          <AccountButtons address={address} />
        </div>
      </AppHero>
      <div className="space-y-8">
        <AccountTokens address={address} />
        <AccountTransactions address={address} />
      </div>
    </div>
  )
}
