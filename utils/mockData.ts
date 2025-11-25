import { AssetType, PriceData } from '../types';

// Helper to generate a date string YYYY-MM-DD going back N weeks
const getWeekDate = (weeksAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - (weeksAgo * 7));
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
};

// Seeded random-ish generator for consistent "mock" curves
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate 15 years (~780 weeks) of mock data
export const generateHistoricalData = (): PriceData[] => {
  const years = 15;
  const weeks = years * 52;
  const data: PriceData[] = [];
  
  // Starting approximate prices (normalized for simulation logic)
  let prices: Record<AssetType, number> = {
    [AssetType.BTC]: 50,
    [AssetType.ETH]: 2, 
    [AssetType.DOGE]: 0.0002,
    
    [AssetType.SP500]: 1200,
    [AssetType.NASDAQ]: 2000,
    [AssetType.CSI300]: 3000,
    [AssetType.HSI]: 21000,
    [AssetType.NIKKEI]: 10000,
    
    [AssetType.AAPL]: 8,
    [AssetType.MSFT]: 25,
    [AssetType.NVDA]: 3,
    [AssetType.TSLA]: 1.5,
    
    [AssetType.GOLD]: 1100,
  };

  for (let i = weeks; i >= 0; i--) {
    const seedBase = i * 100;
    
    // --- CRYPTO ---
    // BTC: High volatility, long term exponential
    const btcVol = (seededRandom(seedBase + 1) - 0.45) * 0.08; 
    prices[AssetType.BTC] = Math.max(1, prices[AssetType.BTC] * (1.0025 + btcVol));

    // ETH: Higher beta to BTC
    const ethVol = (seededRandom(seedBase + 2) - 0.45) * 0.09;
    prices[AssetType.ETH] = Math.max(0.5, prices[AssetType.ETH] * (1.003 + ethVol));

    // DOGE: Flat for long time, then crazy volatility
    const dogeSpike = (weeks - i) > 600 && (seededRandom(seedBase + 3) > 0.95) ? 0.2 : 0;
    const dogeVol = (seededRandom(seedBase + 3) - 0.48) * 0.12 + dogeSpike;
    prices[AssetType.DOGE] = Math.max(0.0001, prices[AssetType.DOGE] * (1.001 + dogeVol));

    // --- INDICES ---
    // SP500: Steady
    const spVol = (seededRandom(seedBase + 4) - 0.48) * 0.025; 
    prices[AssetType.SP500] = prices[AssetType.SP500] * (1.0018 + spVol);

    // Nasdaq: Growth
    const ndxVol = (seededRandom(seedBase + 5) - 0.48) * 0.035;
    prices[AssetType.NASDAQ] = prices[AssetType.NASDAQ] * (1.0022 + ndxVol);

    // CSI300 (China): Volatile, periods of stagnation
    const chinaVol = (seededRandom(seedBase + 6) - 0.5) * 0.045;
    prices[AssetType.CSI300] = Math.max(2000, prices[AssetType.CSI300] * (1.0005 + chinaVol));

    // HSI (HK): Volatile, recent downtrend simulation
    const hsiTrend = (weeks - i) > 600 ? -0.001 : 0.0005; // Recent drag
    const hsiVol = (seededRandom(seedBase + 7) - 0.5) * 0.035;
    prices[AssetType.HSI] = Math.max(15000, prices[AssetType.HSI] * (1 + hsiTrend + hsiVol));

    // Nikkei: Steady then breakout
    const nikkeiVol = (seededRandom(seedBase + 8) - 0.45) * 0.025;
    prices[AssetType.NIKKEI] = prices[AssetType.NIKKEI] * (1.0018 + nikkeiVol);

    // --- STOCKS ---
    // AAPL: Consistent compounder
    const aaplVol = (seededRandom(seedBase + 9) - 0.45) * 0.03;
    prices[AssetType.AAPL] = prices[AssetType.AAPL] * (1.003 + aaplVol);

    // MSFT: Renaissance
    const msftVol = (seededRandom(seedBase + 10) - 0.45) * 0.028;
    prices[AssetType.MSFT] = prices[AssetType.MSFT] * (1.0028 + msftVol);

    // NVDA: Explosion in recent "years"
    const nvdaBoom = (weeks - i) > 500 ? 0.004 : 0;
    const nvdaVol = (seededRandom(seedBase + 11) - 0.45) * 0.05;
    prices[AssetType.NVDA] = prices[AssetType.NVDA] * (1.002 + nvdaBoom + nvdaVol);

    // TSLA: Wild rides
    const tslaVol = (seededRandom(seedBase + 12) - 0.45) * 0.07;
    prices[AssetType.TSLA] = prices[AssetType.TSLA] * (1.0035 + tslaVol);

    // --- COMMODITIES ---
    // Gold: Safe haven
    const goldVol = (seededRandom(seedBase + 13) - 0.5) * 0.02;
    prices[AssetType.GOLD] = prices[AssetType.GOLD] * (1.001 + goldVol);

    const entry: PriceData = {
      date: getWeekDate(i),
      ...prices
    };
    
    data.push(entry);
  }

  return data;
};

export const MOCK_DATA = generateHistoricalData();