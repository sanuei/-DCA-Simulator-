export interface Bindings {
  DCA_USERS: KVNamespace;
  DCA_CODES: KVNamespace;
  DCA_SESSIONS: KVNamespace;
  DCA_REFERRALS: KVNamespace;
  DCA_DATA: KVNamespace;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
}

export interface User {
  id: string;
  email?: string; // Optional if using device auth
  tier: 'free' | 'pro';
  expireAt?: number; // Timestamp
  invitedBy?: string;
  createdAt: number;
}

export interface UserStats {
  inviteCount: number;
  rewardDays: number;
}

export interface ActivationCode {
  code: string;
  status: 'unused' | 'used';
  type: 'pro_monthly' | 'pro_yearly' | 'pro_lifetime';
  durationDays: number; // e.g., 30, 365
  createdBy?: string;
  createdAt: number;
  usedBy?: string;
  usedAt?: number;
}

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

export interface AssetGroupConfig {
  key: string; // Group identifier (e.g. 'crypto')
  order: number; // Display order of the group
}
