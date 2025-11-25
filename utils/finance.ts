import { AssetType, PriceData, SimulationResult, Frequency } from '../types';

export const calculateDCA = (
  data: PriceData[],
  asset: AssetType,
  investmentAmount: number,
  years: number,
  frequency: Frequency
): SimulationResult => {
  // Slice data to the requested timeframe (approx days)
  const daysCount = years * 365;
  const relevantData = data.slice(-daysCount);

  let totalShares = 0;
  let totalInvested = 0;
  let maxPortfolioValue = 0;
  let maxDrawdown = 0;
  
  let lastInvestmentMonth = -1;
  let lastInvestmentWeekYearString = "";

  // Helper to identify weeks (e.g., "2023-W45")
  const getWeekString = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const millisecs = d.getTime() - onejan.getTime();
    const week = Math.ceil((((millisecs / 86400000) + onejan.getDay() + 1) / 7));
    return `${d.getFullYear()}-W${week}`;
  };

  const history = relevantData.map((dayData) => {
    const price = Number(dayData[asset]);
    const dateObj = new Date(dayData.date);
    const currentMonth = dateObj.getMonth();
    
    let shouldBuy = false;

    if (frequency === Frequency.WEEKLY) {
        // Buy on the first available data point of a new week (e.g. Monday or first day we see)
        const currentWeekString = getWeekString(dateObj);
        if (currentWeekString !== lastInvestmentWeekYearString) {
            shouldBuy = true;
            lastInvestmentWeekYearString = currentWeekString;
        }
    } else if (frequency === Frequency.MONTHLY) {
      // Buy on the first available data point of the month
      if (currentMonth !== lastInvestmentMonth) {
        shouldBuy = true;
        lastInvestmentMonth = currentMonth;
      }
    }
    
    if (shouldBuy) {
      const sharesBought = investmentAmount / price;
      totalShares += sharesBought;
      totalInvested += investmentAmount;
    }

    const currentPortfolioValue = totalShares * price;

    // Drawdown Calculation
    if (currentPortfolioValue > maxPortfolioValue) {
      maxPortfolioValue = currentPortfolioValue;
    }
    
    // Only calculate drawdown if we have actually invested
    const currentDrawdown = maxPortfolioValue > 0 
      ? (maxPortfolioValue - currentPortfolioValue) / maxPortfolioValue 
      : 0;
    
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    return {
      date: dayData.date,
      portfolioValue: currentPortfolioValue,
      invested: totalInvested,
    };
  });

  const finalValue = history.length > 0 ? history[history.length - 1].portfolioValue : 0;
  const roi = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;

  // CAGR Calculation
  const cagr = totalInvested > 0 
    ? (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100 
    : 0;

  return {
    asset,
    totalInvested,
    totalValue: finalValue,
    totalShares,
    roi,
    cagr: isNaN(cagr) ? 0 : cagr, 
    maxDrawdown: maxDrawdown * 100,
    history,
  };
};