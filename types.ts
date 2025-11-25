export enum AssetType {
  // Crypto
  BTC = 'BTC',
  ETH = 'ETH',
  DOGE = 'DOGE',
  
  // Indices
  SP500 = 'SP500',
  NASDAQ = 'NASDAQ',
  CSI300 = 'CSI300',
  HSI = 'HSI',
  NIKKEI = 'NIKKEI',
  
  // US Stocks (Tech Giants)
  AAPL = 'AAPL',
  MSFT = 'MSFT',
  NVDA = 'NVDA',
  TSLA = 'TSLA',

  // Commodities
  GOLD = 'GOLD',
}

export enum Frequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum Language {
  ZH_HANT = 'zh_Hant',
  ZH_HANS = 'zh_Hans',
  EN = 'en',
}

export interface PriceData {
  date: string; // YYYY-MM-DD
  [key: string]: string | number; // Allow dynamic access for asset types
}

export interface SimulationResult {
  asset: AssetType;
  totalInvested: number;
  totalValue: number;
  totalShares: number;
  roi: number; // Percentage
  cagr: number; // Percentage
  maxDrawdown: number; // Percentage
  history: {
    date: string;
    portfolioValue: number;
    invested: number;
  }[];
}