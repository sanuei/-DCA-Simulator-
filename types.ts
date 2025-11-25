export enum AssetType {
  // Crypto
  BTC = '比特幣 (BTC)',
  ETH = '以太坊 (ETH)',
  DOGE = '狗狗幣 (DOGE)',
  
  // Indices
  SP500 = '標普500 (S&P500)',
  NASDAQ = '納斯達克100 (Nasdaq)',
  CSI300 = '滬深300 (China)',
  HSI = '恆生指數 (Hong Kong)',
  NIKKEI = '日經225 (Japan)',
  
  // US Stocks (Tech Giants)
  AAPL = '蘋果 (AAPL)',
  MSFT = '微軟 (MSFT)',
  NVDA = '輝達 (NVDA)',
  TSLA = '特斯拉 (TSLA)',

  // Commodities
  GOLD = '黃金 (Gold)',
}

export enum Frequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
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