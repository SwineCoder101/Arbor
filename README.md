# 🌳 Arbor – Delta-Neutral Yield Router

Arbor discovers the best funding-rate spreads across Solana perp DEXes, escrows user margin in a program-derived vault, and atomically opens long + short legs so traders and DAOs can earn **price-neutral yield**.  
Closing the hedge moves **1 %** of the returned margin to a public Treasury vault; no hidden management or performance fees.

---

## 🗂 Monorepo Layout

| Path | Purpose |
|------|---------|
| **`programs/arbor-program/`** | Anchor smart-contract (escrow, vaults, order logic) + on-chain tests. |
| **`sdk/`** | TypeScript wrapper – builders call `ArborClient.createOrder()` etc. |
| **`backend/`** | Rust/NestJS service that streams funding & depth data, ranks spreads, and triggers “snipe” transactions. |
| **`drift-playground/`**, **`experiment/`** | Sandboxes for low-level integrations with Drift, Zeta, Mango, Orderly. |
| **`frontend/`** | React + Tailwind app: connect wallet → discover spread → one-click hedge / close / top-up. |
| **`simulate/`** | Devnet scripts that spin up local keypairs and walk through order lifecycle. |

---



## 1. build on-chain program & run tests
anchor test

## 2. spin up backend data service
cd backend && pnpm dev

## 3. run devnet end-to-end simulation
cd simulate && pnpm ts-node 1_initialize_environment.ts

## 4. start frontend
cd frontend && pnpm dev
