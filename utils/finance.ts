import { AssetType, PriceData, SimulationResult, Frequency } from '../types';

export const calculateDCA = (
  data: PriceData[],
  asset: AssetType,
  investmentAmount: number,
  years: number,
  frequency: Frequency
): SimulationResult => {
  // Slice data to the requested timeframe (approx weeks)
  const weeksCount = years * 52;
  const relevantData = data.slice(-weeksCount);

  let totalShares = 0;
  let totalInvested = 0;
  let maxPortfolioValue = 0;
  let maxDrawdown = 0;
  let lastInvestmentMonth = -1;

  const history = relevantData.map((weekData) => {
    const price = weekData[asset];
    const dateObj = new Date(weekData.date);
    const currentMonth = dateObj.getMonth();

    let shouldBuy = false;

    if (frequency === Frequency.WEEKLY) {
      shouldBuy = true;
    } else if (frequency === Frequency.MONTHLY) {
      // Buy only if we haven't bought in this month yet (simple approximation: buy on first available data point of the month)
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
      date: weekData.date,
      portfolioValue: currentPortfolioValue,
      invested: totalInvested,
    };
  });

  const finalValue = history.length > 0 ? history[history.length - 1].portfolioValue : 0;
  const roi = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;

  // CAGR Calculation: (End Value / Start Value)^(1/n) - 1
  // For DCA, we use a simplified approximation or the total return annualized.
  // We'll use the standard CAGR formula on the Total Value vs Total Invested 
  // (Note: This is technically slightly different from IRR for DCA, but standard for these visualizers)
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
