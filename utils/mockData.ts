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
// We simulate trends: BTC (exponential), SP500/Nasdaq (compounding), Gold (stable/cycles)
export const generateHistoricalData = (): PriceData[] => {
  const years = 15;
  const weeks = years * 52;
  const data: PriceData[] = [];
  
  // Starting approximate prices (normalized for simulation logic)
  let btcPrice = 100; // Early days
  let sp500Price = 1200;
  let nasdaqPrice = 2000;
  let goldPrice = 1100;

  for (let i = weeks; i >= 0; i--) {
    const isBullMarket = (weeks - i) % 260 > 100; // Cycle simulation
    
    // Volatility adjusted for weekly steps (smaller than monthly)
    // Bitcoin: High volatility
    const btcVol = (seededRandom(i) - 0.45) * 0.08; 
    btcPrice = btcPrice * (1.002 + btcVol); 
    if (btcPrice < 50) btcPrice = 50; 

    // S&P 500: Steady growth
    const spVol = (seededRandom(i + 1000) - 0.48) * 0.025; 
    sp500Price = sp500Price * (1.0015 + spVol);

    // Nasdaq: Higher beta
    const ndxVol = (seededRandom(i + 2000) - 0.48) * 0.035;
    nasdaqPrice = nasdaqPrice * (1.0022 + ndxVol);

    // Gold: Lower correlation
    const goldVol = (seededRandom(i + 3000) - 0.5) * 0.02;
    goldPrice = goldPrice * (1.001 + goldVol);

    data.push({
      date: getWeekDate(i),
      [AssetType.BTC]: parseFloat(btcPrice.toFixed(2)),
      [AssetType.SP500]: parseFloat(sp500Price.toFixed(2)),
      [AssetType.NASDAQ]: parseFloat(nasdaqPrice.toFixed(2)),
      [AssetType.GOLD]: parseFloat(goldPrice.toFixed(2)),
    });
  }

  return data;
};

export const MOCK_DATA = generateHistoricalData();
