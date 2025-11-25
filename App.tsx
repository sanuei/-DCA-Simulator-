import React, { useState, useMemo } from 'react';
import { AssetType, SimulationResult, Frequency } from './types';
import { MOCK_DATA } from './utils/mockData';
import { calculateDCA } from './utils/finance';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Settings,
  Calendar,
  DollarSign,
  PieChart
} from 'lucide-react';

const COLORS = {
  [AssetType.BTC]: '#F7931A',   // Bitcoin Orange
  [AssetType.SP500]: '#10B981', // Emerald Green
  [AssetType.NASDAQ]: '#3B82F6', // Blue
  [AssetType.GOLD]: '#EAB308',   // Gold
};

const App: React.FC = () => {
  // --- State ---
  const [selectedYears, setSelectedYears] = useState<number>(5);
  const [activeAssets, setActiveAssets] = useState<AssetType[]>([
    AssetType.BTC,
    AssetType.SP500,
    AssetType.NASDAQ,
    AssetType.GOLD
  ]);
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);

  // --- Derived State (Calculations) ---
  const results = useMemo(() => {
    return activeAssets.map(asset => 
      calculateDCA(MOCK_DATA, asset, investmentAmount, selectedYears, frequency)
    );
  }, [selectedYears, activeAssets, investmentAmount, frequency]);

  // Merge history for the chart
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    
    // Use the first result's dates as the base
    const baseHistory = results[0].history;
    
    return baseHistory.map((item, index) => {
      const mergedPoint: any = { date: item.date };
      results.forEach(res => {
        if (res.history[index]) {
          mergedPoint[res.asset] = Math.round(res.history[index].portfolioValue);
        }
      });
      // Add the "Total Invested" line for reference (taking the first asset's invested amount as they are the same inputs)
      mergedPoint['總投入'] = item.invested; 
      return mergedPoint;
    });
  }, [results]);

  // --- Handlers ---
  const toggleAsset = (asset: AssetType) => {
    setActiveAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">定投回測模擬器 (DCA Simulator)</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Controls Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Investment Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> 定投金額 (USD)
              </label>
              <input
                type="number"
                min="10"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> 定投頻率
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setFrequency(Frequency.MONTHLY)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    frequency === Frequency.MONTHLY
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  每月
                </button>
                <button
                  onClick={() => setFrequency(Frequency.WEEKLY)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    frequency === Frequency.WEEKLY
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  每週
                </button>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Settings className="w-4 h-4" /> 回測時長
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                {[1, 3, 5, 10, 15].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYears(year)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      selectedYears === year 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {year}年
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Selector */}
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <PieChart className="w-4 h-4" /> 對比資產
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(AssetType).map(asset => (
                  <button
                    key={asset}
                    onClick={() => toggleAsset(asset)}
                    className={`flex-1 min-w-[80px] px-2 py-2 rounded-lg border text-xs font-medium transition-all text-center ${
                      activeAssets.includes(asset)
                        ? 'border-transparent text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: activeAssets.includes(asset) ? COLORS[asset] : undefined
                    }}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {results.map(result => (
            <div key={result.asset} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg truncate pr-2" style={{ color: COLORS[result.asset] }}>
                  {result.asset}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${result.roi >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500">總資產 (Value)</span>
                  <span className="font-bold text-xl text-gray-900">${result.totalValue.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full opacity-80" 
                    style={{ width: '100%', backgroundColor: COLORS[result.asset] }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm pt-1">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">總投入本金</span>
                    <span className="font-medium text-gray-700">${result.totalInvested.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-400 text-xs">最大回撤</span>
                    <span className="font-medium text-red-500">
                       -{result.maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                   <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">年化收益率 (CAGR)</span>
                    <span className={`font-medium ${result.cagr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.cagr.toFixed(1)}%
                    </span>
                  </div>
                   <div className="flex flex-col items-end">
                    <span className="text-gray-400 text-xs">最終收益率</span>
                    <span className={`font-medium ${result.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[550px] flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            資產增長趨勢 (Portfolio Growth)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                  minTickGap={50}
                  tickFormatter={(val) => val.slice(0, 4)} // Show only year
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                  tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ padding: 0 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `日期: ${label}`}
                  labelStyle={{ color: '#6B7280', marginBottom: '8px', fontSize: '12px' }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                
                {/* Dashed line for Total Invested Cash */}
                <Line 
                  type="monotone" 
                  dataKey="總投入" 
                  stroke="#9CA3AF" 
                  strokeDasharray="4 4" 
                  dot={false} 
                  strokeWidth={2}
                  name="總投入本金"
                  isAnimationActive={false}
                />

                {/* Asset Lines */}
                {activeAssets.map(asset => (
                  <Line
                    key={asset}
                    type="monotone"
                    dataKey={asset}
                    stroke={COLORS[asset]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;
