'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWalletUi, useWalletUiCluster } from '@wallet-ui/react'
import { address } from 'gill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppAlert } from '@/components/app-alert'
import { toast } from 'sonner'
import { 
  DriftClient, 
  User, 
  initialize, 
  BulkAccountLoader,
  getMarketOrderParams,
  PositionDirection,
  OrderType,
  calculateBidAskPrice,
  convertToNumber,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION,
  BN,
  PerpMarkets,
  MarketType,
  TokenFaucet
} from '@drift-labs/sdk'
import { Connection, PublicKey, Transaction, VersionedTransaction} from '@solana/web3.js'
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

// Simple badge component
const Badge = ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'destructive' ? 'bg-red-100 text-red-800' : 
    variant === 'success' ? 'bg-green-100 text-green-800' : 
    'bg-blue-100 text-blue-800'
  }`}>
    {children}
  </span>
)

interface MarketData {
  marketIndex: number
  symbol: string
  price: number
  bidPrice: number
  askPrice: number
}

type SendTransactionOptions = {
  skipPreflight?: boolean
  preflightCommitment?: string
  maxRetries?: number
  minContextSlot?: number
}

export default function DriftTradingPage() {
  const { account, client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  
  // Drift client state
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  // UI state
  const [isInitializing, setIsInitializing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string>('')
  const [isInitializingUser, setIsInitializingUser] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [isCheckingUsdc, setIsCheckingUsdc] = useState(false)
  
  // Market data
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [selectedMarket, setSelectedMarket] = useState<number>(0)
  
  // Trading form
  const [orderSide, setOrderSide] = useState<'LONG' | 'SHORT'>('LONG')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [orderSize, setOrderSize] = useState<string>('')
  const [limitPrice, setLimitPrice] = useState<string>('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const env = useMemo(() => {
    return cluster.urlOrMoniker === 'mainnet' ? 'mainnet-beta' : 'devnet'
  }, [cluster])

  // Create a working wallet adapter for actual transaction signing
  const createWalletAdapter = useCallback(() => {
    if (!account) {
      throw new Error('Account not available')
    }

    return {
      publicKey: new PublicKey(account.address),
      signTransaction: async (transaction: Transaction | VersionedTransaction) => {
        try {
          console.log('Signing transaction:', transaction)
          
          // For now, we'll implement a basic adapter but note that full transaction signing
          // requires integration with the specific wallet provider
          // This is a placeholder that demonstrates the structure needed
          
          if (transaction instanceof VersionedTransaction) {
            console.log('VersionedTransaction detected')
            // For now, convert to Transaction or handle differently
            throw new Error('VersionedTransaction not yet supported in this demo')
          } else {
            console.log('Legacy Transaction detected')
            // In production, this would use the actual wallet to sign
            // For demo purposes, we'll throw a helpful error
            throw new Error('Transaction signing requires full wallet integration. Use "Create USDC & Initialize" button instead.')
          }
        } catch (error) {
          console.error('Transaction signing failed:', error)
          throw error
        }
      },
      signAllTransactions: async (transactions: (Transaction | VersionedTransaction)[]) => {
        console.log('Multiple transaction signing requested:', transactions)
        throw new Error('Transaction signing requires full wallet integration. Use "Create USDC & Initialize" button instead.')
      }
    }
  }, [account])

  // Check USDC balance
  const checkUsdcBalance = useCallback(async (sdkConfig: { USDC_MINT_ADDRESS: string }) => {
    if (!account || !client) return 0

    try {
      setIsCheckingUsdc(true)
      const userPublicKey = new PublicKey(account.address)
      const usdcTokenAddress = await getAssociatedTokenAddress(
        new PublicKey(sdkConfig.USDC_MINT_ADDRESS),
        userPublicKey
      )

      // Convert PublicKey to Address for the RPC call
      const tokenAddress = address(usdcTokenAddress.toString())
      const tokenAccount = await client.rpc.getAccountInfo(tokenAddress).send()
      
      if (!tokenAccount.value) {
        console.log('No USDC token account found')
        return 0 // No token account exists
      }

      const balance = await client.rpc.getTokenAccountBalance(tokenAddress).send()
      const usdcAmount = parseFloat(String(balance.value.uiAmount || '0'))
      console.log(`USDC balance: ${usdcAmount}`)
      return usdcAmount
    } catch (error) {
      console.log('Error checking USDC balance:', error)
      return 0
    } finally {
      setIsCheckingUsdc(false)
    }
  }, [account, client])



  // Get USDC token address for the user
  // const getUsdcTokenAddress = useCallback(async (mintAddress: string, userPubKey: string): Promise<PublicKey> => {
  //   return getAssociatedTokenAddress(
  //     new PublicKey(mintAddress),
  //     new PublicKey(userPubKey)
  //   )
  // }, [])

    // Get USDC token address for the user (following the example exactly)
  // const getTokenAddress = useCallback(async (mintAddress: string, userPubKey: string): Promise<PublicKey> => {
  //   return getAssociatedTokenAddress(
  //     new PublicKey(mintAddress),
  //     new PublicKey(userPubKey)
  //   )
  // }, [])

  // Create USDC and initialize Drift account exactly like the example
  async function createUsdcTokenAccountIfMissing({
    connection,
    payer,
    userPublicKey,
    usdcMint,
    sendTransaction,
  }: {
    connection: Connection
    payer: PublicKey
    userPublicKey: PublicKey
    usdcMint: PublicKey
    sendTransaction: (
      transaction: Transaction,
      connection: Connection,
      options?: SendTransactionOptions
    ) => Promise<string>
  }) {
    const ata = await getAssociatedTokenAddress(usdcMint, userPublicKey)
    const accountInfo = await connection.getAccountInfo(ata)

    if (accountInfo === null) {
      console.log(`Creating USDC associated token account: ${ata.toBase58()}`)
      const createIx = createAssociatedTokenAccountInstruction(
        payer,
        ata,
        userPublicKey,
        usdcMint
      )

      const tx = new Transaction().add(createIx)
      const txSig = await sendTransaction(tx, connection, { skipPreflight: false })
      await connection.confirmTransaction(txSig, 'confirmed')
      console.log('USDC token account created!')
    } else {
      console.log('USDC token account already exists:', ata.toBase58())
    }

    return ata
  }

  const createUsdcAndInitialize = useCallback(async () => {
    const wallet = createWalletAdapter()
    if (!account || !driftClient || !wallet || !wallet.publicKey) {
      toast.error('Wallet or Drift client not connected')
      return
    }

    try {
      setIsInitializingUser(true)
      console.log('Starting USDC minting and Drift account initialization...')

      const sdkConfig = initialize({ env })
      const userPublicKey = wallet.publicKey
      const usdcMint = new PublicKey(sdkConfig.USDC_MINT_ADDRESS)
      const driftProgramId = new PublicKey(sdkConfig.DRIFT_PROGRAM_ID)

      // Step 1: Check for existing user
      console.log('Step 1: Checking for existing Drift user...')
      const userExists = await driftClient.hasUser()
      if (userExists) {
        console.log('User already exists, subscribing...')
        const userAccountPublicKey = await driftClient.getUserAccountPublicKey()
        const user = new User({
          driftClient,
          userAccountPublicKey,
          accountSubscription: {
            type: 'polling',
            accountLoader: new BulkAccountLoader(driftClient.connection, 'confirmed', 1000),
          },
        })
        await user.subscribe()
        setUser(user)
        toast.success('Connected to existing Drift account!')
        return
      }

      // Step 2: Ensure ATA exists
      console.log('Step 2: Ensuring USDC token account exists...')
      const ata = await createUsdcTokenAccountIfMissing({
        connection: driftClient.connection,
        payer: wallet.publicKey,
        userPublicKey,
        usdcMint,
        sendTransaction: wallet.sendTransaction,
      })

      // Step 3: Mint USDC
      console.log('Step 3: Minting USDC...')
      const tokenFaucet = new TokenFaucet(
        driftClient.connection,
        createWalletAdapter(),
        usdcMint,
        driftProgramId
      )

      const mintAmount = new BN(10_000).mul(QUOTE_PRECISION)
      const [, mintTxSig] = await tokenFaucet.mintTo(userPublicKey, mintAmount)
      await driftClient.connection.confirmTransaction(mintTxSig, 'confirmed')
      console.log(`Minted 10,000 USDC to ${ata.toBase58()}`)

      // Step 4: Initialize Drift User
      console.log('Step 4: Initializing Drift user...')
      const marketIndex = 0
      const [initTxSig, userAccountPublicKey] = await driftClient.initializeUserAccountAndDepositCollateral(
        mintAmount,
        ata,
        marketIndex
      )
      await driftClient.connection.confirmTransaction(initTxSig, 'confirmed')
      console.log('Drift account created!')

      const user = new User({
        driftClient,
        userAccountPublicKey,
        accountSubscription: {
          type: 'polling',
          accountLoader: new BulkAccountLoader(driftClient.connection, 'confirmed', 1000),
        },
      })
      await user.subscribe()
      setUser(user)
      toast.success('Drift account initialized!')

      // Step 5: Refresh balance
      if (client) {
        const updatedBalance = await checkUsdcBalance(sdkConfig)
        setUsdcBalance(updatedBalance)
      }

    } catch (err) {
      console.error('Account creation failed:', err)
      toast.error(`Failed to initialize account: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsInitializingUser(false)
    }
  }, [account, client, driftClient, env, wallet, checkUsdcBalance])
  


  // Initialize Drift Client
  const initializeDrift = useCallback(async () => {
    if (!account) {
      console.log('No account available for Drift initialization')
      return
    }

    try {
      console.log('Starting Drift initialization...')
      setIsInitializing(true)
      setConnectionError('')

      // Initialize SDK
      console.log('Initializing SDK for environment:', env)
      const sdkConfig = initialize({ env })
      
      // Create connection
      const rpcUrl = env === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com' 
        : 'https://api.devnet.solana.com'
      console.log('Creating connection to:', rpcUrl)
      
      const connection = new Connection(rpcUrl, 'confirmed')

      // Test connection
      console.log('Testing RPC connection...')
      const slot = await connection.getSlot()
      console.log('RPC connection successful, current slot:', slot)

      // Create bulk account loader
      console.log('Creating bulk account loader...')
      const loader = new BulkAccountLoader(connection, 'confirmed', 1000)

      // Create wallet adapter
      console.log('Creating wallet adapter...')
      const wallet = createWalletAdapter()

      // Initialize Drift client
      console.log('Initializing Drift client with program ID:', sdkConfig.DRIFT_PROGRAM_ID)
      const drift = new DriftClient({
        connection,
        wallet,
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: {
          type: 'polling',
          accountLoader: loader,
        },
      })

      console.log('Subscribing to Drift client...')
      await drift.subscribe()
      setDriftClient(drift)
      console.log('Drift client initialized successfully')

      // Check if user account exists first, before trying to get the public key
      console.log('Checking if user account exists for wallet...')
      try {
        // Try to get the user account public key - this will fail if no account exists
        const userAccountPublicKey = await drift.getUserAccountPublicKey()
        console.log('User account public key found:', userAccountPublicKey.toString())
        
        const userClient = new User({
          driftClient: drift,
          userAccountPublicKey,
          accountSubscription: {
            type: 'polling',
            accountLoader: loader,
          },
        })

        const userExists = await userClient.exists()
        console.log('User account exists:', userExists)
        
        if (userExists) {
          console.log('Subscribing to user client...')
          await userClient.subscribe()
          setUser(userClient)
          setIsConnected(true)
          toast.success('Connected to Drift Protocol with existing account')
          console.log('Successfully connected to existing Drift account')
        } else {
          console.log('User account public key exists but account data does not - unusual state')
          setIsConnected(true)
          toast.warning('Drift client connected, but user account data not found. You may need to re-initialize.')
        }
      } catch (userError) {
        // This is expected for wallets that don't have Drift accounts yet
        const errorMessage = userError instanceof Error ? userError.message : 'Unknown error'
        console.log('No user account found for this wallet (expected for new users):', errorMessage)
        setIsConnected(true) // Drift client is still connected
        toast.info('Drift client connected successfully! No user account found - you can create one below.')
      }

    } catch (error) {
      console.error('Failed to initialize Drift:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionError(errorMessage)
      toast.error(`Failed to connect to Drift Protocol: ${errorMessage}`)
    } finally {
      setIsInitializing(false)
    }
  }, [account, env, createWalletAdapter])



  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (!driftClient) {
      console.log('No drift client available for market data fetch')
      return
    }

    try {
      console.log('Fetching market data...')
      const marketData: MarketData[] = []
      const perpMarkets = PerpMarkets[env]

      // Only fetch first 3 markets to reduce load
      const marketsToFetch = perpMarkets.slice(0, 3)
      console.log(`Fetching data for ${marketsToFetch.length} markets`)

      for (const marketInfo of marketsToFetch) {
        try {
          const marketAccount = driftClient.getPerpMarketAccount(marketInfo.marketIndex)
          const oracleData = driftClient.getOracleDataForPerpMarket(marketInfo.marketIndex)
          
          if (marketAccount && oracleData) {
            const [bid, ask] = calculateBidAskPrice(marketAccount.amm, oracleData)
            const price = convertToNumber(oracleData.price, PRICE_PRECISION)
            const bidPrice = convertToNumber(bid, PRICE_PRECISION)
            const askPrice = convertToNumber(ask, PRICE_PRECISION)

            marketData.push({
              marketIndex: marketInfo.marketIndex,
              symbol: marketInfo.baseAssetSymbol,
              price,
              bidPrice,
              askPrice,
            })
            console.log(`Fetched ${marketInfo.baseAssetSymbol}: $${price.toFixed(2)}`)
          }
        } catch (error) {
          console.log(`Error fetching market ${marketInfo.marketIndex} (${marketInfo.baseAssetSymbol}):`, error)
        }
      }

      setMarkets(marketData)
      console.log(`Successfully fetched ${marketData.length} markets`)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      // Don't show toast for market data errors as they're not critical
    }
  }, [driftClient, env])

  // Place order
  const placeOrder = useCallback(async () => {
    if (!driftClient || !orderSize) {
      toast.error('Please enter order size')
      return
    }

    if (!user) {
      toast.error('User account not initialized. Please initialize your Drift account first.')
      return
    }

    try {
      setIsPlacingOrder(true)

      const baseAssetAmount = new BN(parseFloat(orderSize) * BASE_PRECISION.toNumber())
      const direction = orderSide === 'LONG' ? PositionDirection.LONG : PositionDirection.SHORT

      let orderParams
      if (orderType === 'MARKET') {
        orderParams = getMarketOrderParams({
          baseAssetAmount,
          direction,
          marketIndex: selectedMarket,
        })
      } else {
        if (!limitPrice) {
          toast.error('Please enter limit price')
          return
        }
        orderParams = {
          orderType: OrderType.LIMIT,
          marketType: MarketType.PERP,
          direction,
          baseAssetAmount,
          price: new BN(parseFloat(limitPrice) * PRICE_PRECISION.toNumber()),
          marketIndex: selectedMarket,
        }
      }

      const txSig = await driftClient.placePerpOrder(orderParams)
      toast.success(`Order placed successfully! Transaction: ${txSig}`)
      
      // Reset form
      setOrderSize('')
      setLimitPrice('')
      
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPlacingOrder(false)
    }
  }, [driftClient, orderSize, orderSide, orderType, selectedMarket, limitPrice, user])

  // Initialize when account changes
  useEffect(() => {
    if (account) {
      initializeDrift()
    } else {
      setDriftClient(null)
      setUser(null)
      setIsConnected(false)
      setMarkets([])
    }
  }, [account?.address, env]) // Remove initializeDrift from dependencies

  // Fetch data periodically - only when we have a connected drift client
  useEffect(() => {
    if (isConnected && driftClient) {
      fetchMarketData()
      
      // Reduce frequency to avoid RPC spam
      const interval = setInterval(() => {
        fetchMarketData()
      }, 30000) // Update every 30 seconds instead of 15
      
      return () => clearInterval(interval)
    }
  }, [isConnected, driftClient]) // Remove fetchMarketData from dependencies

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Drift Protocol Trading</CardTitle>
            <CardDescription>Connect your wallet to start trading perpetuals</CardDescription>
          </CardHeader>
          <CardContent>
            <AppAlert action={<></>}>
              Please connect your wallet to access Drift trading
            </AppAlert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drift Trading</h1>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'success' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge>{env}</Badge>
          {user && <Badge variant="success">User Account: Active</Badge>}
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <AppAlert action={
          <Button variant="outline" onClick={() => initializeDrift()}>
            Retry
          </Button>
        }>
          Connection Error: {connectionError}
        </AppAlert>
      )}

      {/* Loading State */}
      {(isInitializing || isInitializingUser) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">
                {isInitializing ? 'Initializing Drift connection...' : 'Initializing user account...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Place Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Market Selection */}
            <div>
              <Label>Market</Label>
              <select 
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md bg-white text-sm"
              >
                {markets.map((market) => (
                  <option key={market.marketIndex} value={market.marketIndex}>
                    {market.symbol}-PERP (${market.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Side */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderSide === 'LONG' ? 'default' : 'outline'}
                onClick={() => setOrderSide('LONG')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                LONG
              </Button>
              <Button
                variant={orderSide === 'SHORT' ? 'default' : 'outline'}
                onClick={() => setOrderSide('SHORT')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                SHORT
              </Button>
            </div>

            {/* Order Type */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === 'MARKET' ? 'default' : 'outline'}
                onClick={() => setOrderType('MARKET')}
              >
                Market
              </Button>
              <Button
                variant={orderType === 'LIMIT' ? 'default' : 'outline'}
                onClick={() => setOrderType('LIMIT')}
              >
                Limit
              </Button>
            </div>

            {/* Order Size */}
            <div>
              <Label>Size</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
              />
            </div>

            {/* Limit Price */}
            {orderType === 'LIMIT' && (
              <div>
                <Label>Limit Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                />
              </div>
            )}

            {/* Place Order Button */}
            <Button
              onClick={placeOrder}
              disabled={isPlacingOrder || !isConnected || !orderSize || !user}
              className="w-full"
            >
              {isPlacingOrder ? 'Placing Order...' : `Place ${orderSide} Order`}
            </Button>
          </CardContent>
        </Card>

        {/* Markets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Markets</CardTitle>
              {isConnected && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchMarketData()}
                  disabled={!driftClient}
                >
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isConnected ? (
                <p className="text-gray-500">Connect to Drift to view markets</p>
              ) : markets.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-gray-500">Loading markets...</p>
                </div>
              ) : (
                markets.map((market) => (
                  <div 
                    key={market.marketIndex} 
                    className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      selectedMarket === market.marketIndex ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedMarket(market.marketIndex)}
                  >
                    <div>
                      <h3 className="font-semibold">{market.symbol}-PERP</h3>
                      <p className="text-sm text-gray-500">Perpetual Future</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${market.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        ${market.bidPrice.toFixed(2)} / ${market.askPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Wallet:</strong> {account.address.toString().slice(0, 8)}...{account.address.toString().slice(-8)}</p>
            <p><strong>Network:</strong> {cluster.label}</p>
            <p><strong>Drift Account:</strong> {user ? 'Active' : 'Not Found'}</p>
            {env === 'devnet' && (
              <p className="text-sm text-blue-600">
                <strong>Devnet Mode:</strong> Account initialization with automatic USDC setup available!
              </p>
            )}
            {usdcBalance > 0 && (
              <p className="text-sm text-green-600">
                <strong>USDC Balance:</strong> {usdcBalance.toFixed(2)} USDC
              </p>
            )}
            {env === 'mainnet-beta' && (
              <p className="text-sm text-orange-600">
                <strong>Mainnet Mode:</strong> Account initialization requires 100 USDC
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Account Initialization */}
      {!user && isConnected && (
        <AppAlert action={
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={async () => {
                if (driftClient) {
                  const sdkConfig = initialize({ env })
                  const balance = await checkUsdcBalance(sdkConfig)
                  setUsdcBalance(balance)
                }
              }}
              disabled={!driftClient || isCheckingUsdc}
            >
              {isCheckingUsdc ? 'Checking...' : 'Check USDC Balance'}
            </Button>
            <Button 
              variant="default"
              onClick={createUsdcAndInitialize}
              disabled={isInitializingUser || !driftClient}
            >
              {isInitializingUser ? 'Creating & Initializing...' : 'Initialize Drift Account'}
            </Button>
          </div>
                  }>
            {env === 'devnet' 
              ? 'No Drift account found. You can initialize one directly here with automatic USDC setup.'
              : 'No Drift account found. You can initialize one here (requires 1000 USDC in your wallet).'
            }
        </AppAlert>
      )}

      {/* Important Notice */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Important Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>This is a demo trading interface.</strong>
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Transaction signing is not yet implemented</li>
              <li>You need to integrate with your web3auth provider for actual trading</li>
              <li>Account initialization requires USDC tokens in your wallet</li>
              <li>On devnet, use <code>TokenFaucet</code> and <code>initializeUserAccountForDevnet()</code> to mint USDC automatically</li>
              <li>Always test thoroughly on devnet before using on mainnet</li>
              <li>Consider implementing proper error handling and risk management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
