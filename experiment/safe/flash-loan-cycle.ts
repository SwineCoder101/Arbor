import {
    Connection, Keypair, Transaction, sendAndConfirmTransaction, PublicKey
  } from "@solana/web3.js";
  import {
    flashBorrowReserveLiquidityInstruction,
    flashRepayReserveLiquidityInstruction,
  } from "@solendprotocol/solend-sdk"; 

  import wallet from "../dev-wallet.json"
import { MainMarket } from "./dto/main-market";
import { DEVNET_PROGRAM_ID } from "./util";
  
  (async () => {
    // const connection = new Connection("https://api.mainnet-beta.solana.com");
    // const user = Keypair.fromSecretKey(/* ... */);

    const user = Keypair.fromSecretKey(new Uint8Array(wallet.privateKey));
    const connection = new Connection("https://api.mainnet-beta.solana.com");

    const market = new MainMarket('devnet');

    const usdcReserve = market.getMarketReserveBySymbol('USDC');
    
    if (!usdcReserve) {
      throw new Error('USDC reserve not found');
    }

    const usdcReserveAccount = market.toReserveAccount(usdcReserve);
  
    const flashAmount = 100_000 * 1e6; // 100k USDC (base units)
  
    // 2. Build flash borrow & repay ixs
    const flashBorrowIx = flashBorrowReserveLiquidityInstruction(
      flashAmount,
      usdcReserveAccount.liquidityAddress,
      user.publicKey,               // flash-loan destination ATA
      usdcReserveAccount.address,
      market.getMarketAddress(),
      DEVNET_PROGRAM_ID,
    );

    const flashRepayIx = flashRepayReserveLiquidityInstruction(
      flashAmount,
      0,                            // no extra fee param in v2
      user.publicKey,
      usdcReserveAccount.liquidityAddress,
      usdcReserveAccount.liquidityFeeReceiverAddress,
      market.getOwnerAddress(),  //hostFeeReceiver
      usdcReserveAccount.address, // reserve
      market.getMarketAddress(),
      user.publicKey,
      DEVNET_PROGRAM_ID,
    );
  
    // 3. Bundle into one transaction (insert your arb logic between)
    const tx = new Transaction()
      .add(flashBorrowIx)
      // --- INSERT Drift/Jupiter gap-trade instructions here ---
      .add(flashRepayIx);
  
    await sendAndConfirmTransaction(connection, tx, [user]);
    console.log("Flash‑loan cycle complete — loan repaid in same tx");
  })();
  