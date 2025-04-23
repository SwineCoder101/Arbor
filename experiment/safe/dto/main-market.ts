import * as MainMarketMainnet from "../payload/main-market-mainnet.json";
import * as MainMarketDevnet from "../payload/main-market-devnet.json";
import { PublicKey } from "@solana/web3.js";

export type MainMarketType = 'mainnet' | 'devnet';

export type Reserve = 
{
    asset: string;
    address: string;
    collateralMintAddress: string;
    collateralSupplyAddress: string;
    liquidityAddress: string;
    liquidityFeeReceiverAddress: string;
    userBorrowCap?: string;
    userSupplyCap?: string;
}

export type ReserveAccount = {
    asset: string;
    address: PublicKey;
    collateralMintAddress: PublicKey;
    collateralSupplyAddress: PublicKey;
    liquidityAddress: PublicKey;
    liquidityFeeReceiverAddress: PublicKey;
    userBorrowCap?: string;
    userSupplyCap?: string;
}

export class MainMarket {

    static mainMarketPayload = {
        mainnet: MainMarketMainnet,
        devnet: MainMarketDevnet
    }

    private _market: typeof MainMarketMainnet | typeof MainMarketDevnet;

    constructor(
        public readonly marketType: MainMarketType
    ) {
        if (marketType === 'mainnet') {
            this._market = MainMarketMainnet;
        } else {
            this._market = MainMarketDevnet;
        }
    }

    public getMarketReserveBySymbol(symbol: string) : Reserve | undefined {
        return this._market.reserves.find(r => r.asset === symbol) as Reserve | undefined;
    }

    public getMarketAddress() : PublicKey {
        return new PublicKey(this._market.address);
    }

    public getMarketAuthorityAddress() : PublicKey {
        return new PublicKey(this._market.authorityAddress);
    }

    public getCreaterAddress() : PublicKey {
        return new PublicKey(this._market.creator);
    }
    public getOwnerAddress() : PublicKey {
        if (this._market === MainMarketMainnet) {
            return new PublicKey(this._market.owner);
        }
        return new PublicKey(this._market.creator);
    }

    public getMarketReserveByAddress(address: string) : Reserve | undefined {
        return this._market.reserves.find(r => r.address === address) as Reserve | undefined;
    }

    public toReserveAccount(reserve: Reserve) : ReserveAccount {
        return {
            asset: reserve.asset,
            address: new PublicKey(reserve.address),
            collateralMintAddress: new PublicKey(reserve.collateralMintAddress),
            collateralSupplyAddress: new PublicKey(reserve.collateralSupplyAddress),
            liquidityAddress: new PublicKey(reserve.liquidityAddress),
            liquidityFeeReceiverAddress: new PublicKey(reserve.liquidityFeeReceiverAddress),
            
        }
    }
}