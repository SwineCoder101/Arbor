import { MainnetPerpMarkets, DevnetPerpMarkets } from "@drift-labs/sdk";

export const getSymbolForMarketIndex = (marketIndex: number, env: 'devnet' | 'mainnet') => {
		const markets =
			 env === 'devnet'
				? DevnetPerpMarkets
				: MainnetPerpMarkets;
		return markets[marketIndex].symbol;
	}

