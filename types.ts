export enum AssetType {
  // Crypto
  BTC = 'BTC',
  ETH = 'ETH',
  SOL = 'SOL',
  BNB = 'BNB',
  XRP = 'XRP',
  ADA = 'ADA',
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
  GOOGL = 'GOOGL',
  AMZN = 'AMZN',
  META = 'META',
  NVDA = 'NVDA',
  TSLA = 'TSLA',
  NFLX = 'NFLX',
  AMD = 'AMD',
  INTC = 'INTC',
  V = 'V',
  JNJ = 'JNJ',
  PFE = 'PFE',
  PG = 'PG',

  // Commodities
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  OIL = 'OIL',
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

export interface AssetConfig {
  symbol: string; // Internal key (e.g. BTC)
  yahooSymbol: string; // Yahoo ticker (e.g. BTC-USD)
  name: string;
  type: 'crypto' | 'index' | 'stock' | 'commodity';
  color: string; // Hex color code (e.g. #F7931A)
  group: string; // Group key (e.g. 'crypto', 'indices', 'tech', 'commodities')
  isFree: boolean; // Whether this asset is available to free users
  order: number; // Display order within the group
}