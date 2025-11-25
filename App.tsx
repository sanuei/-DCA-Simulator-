import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  PieChart,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Clock
} from 'lucide-react';

// Color Palette for Assets
const COLORS = {
  // Crypto
  [AssetType.BTC]: '#F7931A',   // Bitcoin Orange
  [AssetType.ETH]: '#627EEA',   // Ethereum Purple/Blue
  [AssetType.DOGE]: '#BA9F33',  // Doge Dark Yellow
  
  // Indices
  [AssetType.SP500]: '#10B981', // Emerald Green
  [AssetType.NASDAQ]: '#3B82F6', // Blue
  [AssetType.CSI300]: '#EF4444', // Red (China)
  [AssetType.HSI]: '#0D9488',   // Teal (HK)
  [AssetType.NIKKEI]: '#64748B',// Slate (Japan)
  
  // Stocks
  [AssetType.AAPL]: '#9CA3AF',  // Gray
  [AssetType.MSFT]: '#0EA5E9',  // Light Blue
  [AssetType.NVDA]: '#84CC16',  // Lime Green
  [AssetType.TSLA]: '#DC2626',  // Red
  
  // Commodities
  [AssetType.GOLD]: '#EAB308',   // Gold
};

// Grouping for the UI selector
const ASSET_GROUPS = [
  { 
    label: '主流加密貨幣', 
    assets: [AssetType.BTC, AssetType.ETH, AssetType.DOGE] 
  },
  { 
    label: '全球指數/大盤', 
    assets: [AssetType.SP500, AssetType.NASDAQ, AssetType.CSI300, AssetType.HSI, AssetType.NIKKEI] 
  },
  { 
    label: '美股科技巨頭', 
    assets: [AssetType.AAPL, AssetType.MSFT, AssetType.NVDA, AssetType.TSLA] 
  },
  { 
    label: '商品/避險', 
    assets: [AssetType.GOLD] 
  },
];

const App: React.FC = () => {
  // --- State ---
  const [selectedYears, setSelectedYears] = useState<number>(5);
  const [activeAssets, setActiveAssets] = useState<AssetType[]>([
    AssetType.BTC,
    AssetType.SP500,
    AssetType.NASDAQ,
  ]);
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null); // null means full history (finished)
  
  // Smooth Y-Axis State
  const [yAxisDomainMax, setYAxisDomainMax] = useState<number | null>(null);
  const visualMaxRef = useRef<number>(0); // Current visual top of the chart (for smoothing)
  const dataMaxRef = useRef<number>(0);   // Actual max value encountered so far (to prevent shrinking)

  // --- Derived State (Calculations) ---
  const results = useMemo(() => {
    return activeAssets.map(asset => 
      calculateDCA(MOCK_DATA, asset, investmentAmount, selectedYears, frequency)
    );
  }, [selectedYears, activeAssets, investmentAmount, frequency]);

  // Full History Data
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
      // Add the "Total Invested" line for reference
      mergedPoint['總投入'] = item.invested; 
      return mergedPoint;
    });
  }, [results]);

  // --- Animation Logic ---

  // Reset animation when data config changes
  useEffect(() => {
    setPlaybackIndex(null);
    setIsPlaying(false);
    setYAxisDomainMax(null);
    visualMaxRef.current = 0;
    dataMaxRef.current = 0;
  }, [selectedYears, activeAssets, investmentAmount, frequency]);

  // Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          const totalPoints = chartData.length;
          // If null (finished/not started), start from 0
          const current = prev === null ? 0 : prev;
          
          if (current >= totalPoints - 1) {
            setIsPlaying(false);
            setYAxisDomainMax(null); // Reset to auto scaling when finished for perfect fit
            return null; 
          }

          const nextIndex = current + 1;
          const nextDataPoint = chartData[nextIndex];

          if (nextDataPoint) {
            // 1. Determine the max value at this specific new data point across all active lines
            let currentPointMax = 0;
            activeAssets.forEach(asset => {
              const val = nextDataPoint[asset] as number;
              if (val > currentPointMax) currentPointMax = val;
            });

            // 2. Update the "All Time High" seen so far in this animation run.
            // We use this to ensure the chart never "zooms in" (shrinks Y axis) during drawdowns,
            // which looks confusing. It only expands.
            if (currentPointMax > dataMaxRef.current) {
              dataMaxRef.current = currentPointMax;
            }

            // 3. Calculate target visual max (Data Max + 15% padding for aesthetics)
            const targetVisualMax = dataMaxRef.current * 1.15;
            
            // 4. Smoothly interpolate (Lerp) current visual max towards target.
            // Current frame visual max
            const currentVisual = visualMaxRef.current;
            
            // Initial jump start if we are at 0
            if (currentVisual === 0 && targetVisualMax > 0) {
               visualMaxRef.current = targetVisualMax;
            } else {
               // The easing factor (0.1). Lower = slower/smoother, Higher = snappier.
               // 0.1 per 22ms is responsive but smooth.
               const dist = targetVisualMax - currentVisual;
               visualMaxRef.current = currentVisual + dist * 0.1;
            }
            
            setYAxisDomainMax(visualMaxRef.current);
          }

          // Requirement: 8 seconds per year.
          // Data granularity is Daily (365 points per year).
          // 8000ms / 365 points ≈ 21.9ms per point.
          return nextIndex;
        });
      }, 22); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, chartData, activeAssets]);

  const handlePlayPause = () => {
    if (playbackIndex === null) {
      // Starting fresh
      setPlaybackIndex(0);
      dataMaxRef.current = 0;
      visualMaxRef.current = 0;
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    setYAxisDomainMax(null);
    dataMaxRef.current = 0;
    visualMaxRef.current = 0;
  };

  // --- Dynamic Data for Display ---
  
  // If animating, slice the data. If null, show everything.
  const totalPoints = chartData.length;
  const currentIndex = playbackIndex === null ? totalPoints - 1 : Math.min(playbackIndex, totalPoints - 1);
  const safeIndex = Math.max(0, currentIndex);
  
  const displayedChartData = useMemo(() => {
    if (playbackIndex === null) return chartData;
    // Slice + 1 because slice is exclusive, we want to include the current index
    return chartData.slice(0, safeIndex + 1);
  }, [chartData, playbackIndex, safeIndex]);

  const currentSimulationDate = chartData[safeIndex]?.date || '';

  // Calculate stats based on current playback time
  const currentStats = useMemo(() => {
    return results.map(res => {
      // Find the history item corresponding to current animation frame
      const historyItem = res.history[safeIndex];
      if (!historyItem) return { ...res, roi: 0, totalValue: 0, maxDrawdown: 0, cagr: 0 };
      
      // Real-time Max Drawdown Calculation for the current slice
      let localMax = 0;
      let localDD = 0;
      
      // Optimization: We are iterating potentially 5000 items. 
      // For standard JS engines, this is still very fast (<1ms).
      for (let i = 0; i <= safeIndex; i++) {
        const val = res.history[i]?.portfolioValue || 0;
        if (val > localMax) localMax = val;
        const dd = localMax > 0 ? (localMax - val) / localMax : 0;
        if (dd > localDD) localDD = dd;
      }

      const invested = historyItem.invested;
      const val = historyItem.portfolioValue;
      const roi = invested > 0 ? ((val - invested) / invested) * 100 : 0;
      
      // CAGR approximation
      const start = new Date(res.history[0].date).getTime();
      const now = new Date(historyItem.date).getTime();
      const yearsPassed = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
      
      const cagr = (invested > 0 && yearsPassed > 0.1) 
          ? (Math.pow(val / invested, 1 / yearsPassed) - 1) * 100
          : 0; 

      return {
        ...res,
        totalInvested: invested,
        totalValue: val,
        roi,
        maxDrawdown: localDD * 100,
        cagr: isNaN(cagr) ? 0 : cagr
      };
    });
  }, [results, safeIndex]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            
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
          </div>

          {/* Asset Selector (Grouped) */}
          <div className="space-y-4">
             <label className="text-sm font-medium text-gray-600 flex items-center gap-1 border-b pb-2">
                <PieChart className="w-4 h-4" /> 選擇對比資產
              </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ASSET_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</h4>
                  <div className="flex flex-col gap-2">
                    {group.assets.map(asset => (
                      <button
                        key={asset}
                        onClick={() => toggleAsset(asset)}
                        className={`relative flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          activeAssets.includes(asset)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[asset] }}></span>
                          {asset.split(' ')[0]} {/* Show short name */}
                        </div>
                        {activeAssets.includes(asset) && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Cards (Dynamic based on animation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentStats.map(result => (
            <div key={result.asset} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-bold text-gray-800 text-lg truncate pr-2" style={{ color: COLORS[result.asset] }}>
                  {result.asset.split(' ')[0]}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-300 ${result.roi >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500">總資產 (Value)</span>
                  <span className="font-bold text-xl text-gray-900 transition-all duration-300">${result.totalValue.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full opacity-80 transition-all duration-300" 
                    style={{ width: '100%', backgroundColor: COLORS[result.asset] }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm pt-1 border-t border-gray-50 mt-2">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">總投入</span>
                    <span className="font-medium text-gray-700 transition-all duration-300">${result.totalInvested.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-gray-400 text-xs">最大回撤</span>
                    <span className="font-medium text-red-500 transition-all duration-300">
                       -{result.maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                   <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">年化 (CAGR)</span>
                    <span className={`font-medium transition-all duration-300 ${result.cagr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.cagr.toFixed(1)}%
                    </span>
                  </div>
                   <div className="flex flex-col items-end">
                    <span className="text-gray-400 text-xs">最終收益</span>
                    <span className={`font-medium transition-all duration-300 ${result.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
          
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              資產增長趨勢 (Portfolio Growth)
            </h3>

            {/* Playback Controls */}
            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                 <button 
                  onClick={handlePlayPause}
                  className="p-2 rounded-full hover:bg-white hover:shadow-sm text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  title={isPlaying ? "暫停" : "播放動畫"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                  title="重置"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Date Display */}
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-md border border-gray-200 shadow-sm min-w-[140px] justify-center">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-mono font-medium text-gray-700">
                  {currentSimulationDate || 'YYYY-MM-DD'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
                  tickFormatter={(val) => {
                     if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
                     if (val >= 1000) return `$${(val/1000).toFixed(0)}k`;
                     return `$${val}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                  // Increase tick count for better density
                  tickCount={8}
                  // Use controlled domain with custom smoothing, or auto when static
                  domain={[0, yAxisDomainMax || 'auto']}
                  allowDataOverflow={true}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E5E7EB', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ padding: 2, fontSize: '13px' }}
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
                    isAnimationActive={false} 
                    name={asset.split(' ')[0]} 
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