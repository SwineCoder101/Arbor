'use client'

import { TOKEN_2022_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from 'gill/programs/token'
import { getTransferSolInstruction } from 'gill/programs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  UiWalletAccount,
  useWalletAccountTransactionSendingSigner,
  useWalletUi,
  useWalletUiCluster,
} from '@wallet-ui/react'
import {
  address,
  Address,
  airdropFactory,
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithSingleSendingSigner,
  Blockhash,
  createTransactionMessage,
  getBase58Decoder,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  SolanaClient,
  TransactionSendingSigner,
} from 'gill'
import { toast } from 'sonner'
import { useTransactionToast } from '../use-transaction-toast'

export function useGetBalance({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['get-balance', { cluster, address }],
    queryFn: () =>
      client.rpc
        .getBalance(address)
        .send()
        .then((res) => res.value),
  })
}

export function useGetSignatures({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['get-signatures', { cluster, address }],
    queryFn: () => client.rpc.getSignaturesForAddress(address).send(),
  })
}

export function useGetTokenAccounts({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['get-token-accounts', { cluster, address }],
    queryFn: async () =>
      Promise.all([
        client.rpc
          .getTokenAccountsByOwner(
            address,
            { programId: TOKEN_PROGRAM_ADDRESS },
            { commitment: 'confirmed', encoding: 'jsonParsed' },
          )
          .send()
          .then((res) => res.value ?? []),
        client.rpc
          .getTokenAccountsByOwner(
            address,
            { programId: TOKEN_2022_PROGRAM_ADDRESS },
            { commitment: 'confirmed', encoding: 'jsonParsed' },
          )
          .send()
          .then((res) => res.value ?? []),
      ]).then(([tokenAccounts, token2022Accounts]) => [...tokenAccounts, ...token2022Accounts]),
  })
}

export function useTransferSol({ address, account }: { address: Address; account: UiWalletAccount }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()
  const toastTransaction = useTransactionToast()
  const txSigner = useWalletAccountTransactionSendingSigner(account, cluster.id)
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['transfer-sol', { cluster, address }],
    mutationFn: async (input: { destination: Address; amount: number }) => {
      try {
        const { signature } = await createTransaction({
          txSigner: txSigner as unknown as TransactionSendingSigner,
          destination: input.destination,
          amount: input.amount,
          client,
        })

        console.log(signature)
        return signature
      } catch (error: unknown) {
        console.log('error', `Transaction failed! ${error}`)

        return
      }
    },
    onSuccess: (signature) => {
      if (signature?.length) {
        toastTransaction(signature)
      }
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['get-balance', { cluster, address }],
        }),
        queryClient.invalidateQueries({
          queryKey: ['get-signatures', { cluster, address }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

export function useRequestAirdrop({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()
  const queryClient = useQueryClient()
  const toastTransaction = useTransactionToast()
  const airdrop = airdropFactory(client)

  return useMutation({
    mutationKey: ['airdrop', { cluster, address }],
    mutationFn: async (amount: number = 1) =>
      airdrop({
        commitment: 'confirmed',
        recipientAddress: address,
        lamports: lamports(BigInt(Math.round(amount * 1_000_000_000))),
      }),
    onSuccess: (signature) => {
      toastTransaction(signature)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['get-balance', { cluster, address }] }),
        queryClient.invalidateQueries({ queryKey: ['get-signatures', { cluster, address }] }),
      ])
    },
  })
}

export function useMintUsdc({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const queryClient = useQueryClient()
  const toastTransaction = useTransactionToast()

  return useMutation({
    mutationKey: ['mint-usdc', { cluster, address }],
    mutationFn: async (amount: number = 100) => {
      // This is a mock implementation for demo purposes
      // In a real application, this would call a token minting program
      console.log(`Minting ${amount} USDC for ${address.toString()}`)
      
      // Simulate a transaction signature
      return `mock-tx-${Math.random().toString(36).substring(2)}`
    },
    onSuccess: (signature) => {
      toastTransaction(signature)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['get-token-accounts', { cluster, address }] }),
        queryClient.invalidateQueries({ queryKey: ['get-signatures', { cluster, address }] }),
      ])
    },
  })
}

export function useGetUsdcBalance({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['get-usdc-balance', { cluster, address }],
    queryFn: async () => {
      // This is a mock implementation
      // In a real app, it would query the USDC token account balance
      // You would need to know the USDC mint address and find the token account owned by this address
      
      // For demo purposes, return a random balance
      return Math.floor(Math.random() * 10000) / 100
    },
  })
}

async function createTransaction({
  amount,
  destination,
  client,
  txSigner,
}: {
  amount: number
  destination: Address
  client: SolanaClient
  txSigner: TransactionSendingSigner
}): Promise<{
  signature: string
  latestBlockhash: {
    blockhash: Blockhash
    lastValidBlockHeight: bigint
  }
}> {
  const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(txSigner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          amount,
          destination: address(destination),
          source: txSigner,
        }),
        m,
      ),
  )
  assertIsTransactionMessageWithSingleSendingSigner(message)

  const signature = await signAndSendTransactionMessageWithSigners(message)

  return {
    signature: getBase58Decoder().decode(signature),
    latestBlockhash,
  }
}
