import { AssetType, PriceData } from '../types';

// Helper to generate a date string YYYY-MM-DD going back N days
const getDayDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
};

// Seeded random-ish generator for consistent "mock" curves
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate 15 years (~5475 days) of mock data
export const generateHistoricalData = (): PriceData[] => {
  const years = 15;
  const days = years * 365;
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

  for (let i = days; i >= 0; i--) {
    const seedBase = i * 100;
    
    // --- CRYPTO ---
    // Daily Volatility is approx Weekly Vol / sqrt(7). Reducing factors by ~2.5-3x
    const btcVol = (seededRandom(seedBase + 1) - 0.45) * 0.035; 
    prices[AssetType.BTC] = Math.max(1, prices[AssetType.BTC] * (1.0003 + btcVol));

    const ethVol = (seededRandom(seedBase + 2) - 0.45) * 0.04;
    prices[AssetType.ETH] = Math.max(0.5, prices[AssetType.ETH] * (1.0004 + ethVol));

    // DOGE: Flat then spike
    const dogeSpike = (days - i) > 4200 && (seededRandom(seedBase + 3) > 0.98) ? 0.1 : 0;
    const dogeVol = (seededRandom(seedBase + 3) - 0.48) * 0.05 + dogeSpike;
    prices[AssetType.DOGE] = Math.max(0.0001, prices[AssetType.DOGE] * (1.0001 + dogeVol));

    // --- INDICES ---
    const spVol = (seededRandom(seedBase + 4) - 0.48) * 0.012; 
    prices[AssetType.SP500] = prices[AssetType.SP500] * (1.00025 + spVol);

    const ndxVol = (seededRandom(seedBase + 5) - 0.48) * 0.016;
    prices[AssetType.NASDAQ] = prices[AssetType.NASDAQ] * (1.0003 + ndxVol);

    const chinaVol = (seededRandom(seedBase + 6) - 0.5) * 0.02;
    prices[AssetType.CSI300] = Math.max(2000, prices[AssetType.CSI300] * (1.0001 + chinaVol));

    const hsiTrend = (days - i) > 4200 ? -0.00015 : 0.00005; 
    const hsiVol = (seededRandom(seedBase + 7) - 0.5) * 0.018;
    prices[AssetType.HSI] = Math.max(15000, prices[AssetType.HSI] * (1 + hsiTrend + hsiVol));

    const nikkeiVol = (seededRandom(seedBase + 8) - 0.45) * 0.012;
    prices[AssetType.NIKKEI] = prices[AssetType.NIKKEI] * (1.00025 + nikkeiVol);

    // --- STOCKS ---
    const aaplVol = (seededRandom(seedBase + 9) - 0.45) * 0.015;
    prices[AssetType.AAPL] = prices[AssetType.AAPL] * (1.0004 + aaplVol);

    const msftVol = (seededRandom(seedBase + 10) - 0.45) * 0.014;
    prices[AssetType.MSFT] = prices[AssetType.MSFT] * (1.00035 + msftVol);

    const nvdaBoom = (days - i) > 3500 ? 0.0006 : 0;
    const nvdaVol = (seededRandom(seedBase + 11) - 0.45) * 0.022;
    prices[AssetType.NVDA] = prices[AssetType.NVDA] * (1.0002 + nvdaBoom + nvdaVol);

    const tslaVol = (seededRandom(seedBase + 12) - 0.45) * 0.03;
    prices[AssetType.TSLA] = prices[AssetType.TSLA] * (1.0005 + tslaVol);

    // --- COMMODITIES ---
    const goldVol = (seededRandom(seedBase + 13) - 0.5) * 0.01;
    prices[AssetType.GOLD] = prices[AssetType.GOLD] * (1.00015 + goldVol);

    const entry: PriceData = {
      date: getDayDate(i),
      ...prices
    };
    
    data.push(entry);
  }

  return data;
};

export const MOCK_DATA = generateHistoricalData();