export enum AssetType {
  BTC = '比特幣',
  SP500 = '標普500',
  NASDAQ = '納斯達克100',
  GOLD = '黃金',
}

export enum Frequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface PriceData {
  date: string; // YYYY-MM-DD
  [AssetType.BTC]: number;
  [AssetType.SP500]: number;
  [AssetType.NASDAQ]: number;
  [AssetType.GOLD]: number;
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
