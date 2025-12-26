import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AssetType, PriceData, Frequency, Language, AssetConfig } from './types';
import { loadHistoricalData, isUsingFallback } from './utils/dataLoader';
import { calculateDCA } from './utils/finance';
import { useUserStore } from './src/store/userStore';
import { AuthModal } from './src/components/AuthModal';
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
  Clock,
  Globe,
  Info,
  Crown,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Share2
} from 'lucide-react';
import { TRANSLATIONS } from './src/utils/translations';

const FREE_YEARS_LIMIT = [1, 3, 5];
const FREE_MAX_ASSETS = 3; // 免费用户最多可选择3个资产
const API_URL = import.meta.env.VITE_API_URL || 'https://dca-simulator-api.sonic980828.workers.dev';

const App: React.FC = () => {
  // --- Auth State ---
  const { isPro, login, user, stats, checkStatus } = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'upgrade' | 'invite'>('upgrade');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['crypto', 'indices']);

  // --- Asset Config State (Dynamic) ---
  const [assetsConfig, setAssetsConfig] = useState<AssetConfig[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);

  // --- Detect language from domain or URL ---
  const detectLanguage = (): Language => {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // Check domain
    if (hostname.includes('zh-hant.') || hostname.includes('tw.')) {
      return Language.ZH_HANT;
    }
    if (hostname.includes('en.') || hostname.includes('english.')) {
      return Language.EN;
    }

    // Check pathname
    if (pathname.includes('/zh-hant') || pathname.includes('/tw')) {
      return Language.ZH_HANT;
    }
    if (pathname.includes('/en') || pathname.includes('/english')) {
      return Language.EN;
    }

    // Default to Simplified Chinese
    return Language.ZH_HANS;
  };

  // --- State ---
  const [language, setLanguage] = useState<Language>(detectLanguage());
  const [selectedYears, setSelectedYears] = useState<number>(3);
  const [activeAssets, setActiveAssets] = useState<AssetType[]>([
    AssetType.BTC,
    AssetType.SP500,
  ]);
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);

  // 真实历史数据状态
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFallbackWarning, setShowFallbackWarning] = useState<boolean>(false);

  const t = TRANSLATIONS[language];

  // --- Update SEO meta tags when language changes ---
  useEffect(() => {
    const updateSEO = () => {
      const titles: Record<Language, string> = {
        [Language.ZH_HANS]: '定投复利模拟器 | 比特币、美股、黄金历史回测工具',
        [Language.ZH_HANT]: '定投復利模擬器 | 比特幣、美股、黃金歷史回測工具',
        [Language.EN]: 'DCA Simulator | Bitcoin, Stocks, Gold Backtest Tool'
      };

      const descriptions: Record<Language, string> = {
        [Language.ZH_HANS]: '免费的投资定投计算器 (DCA Simulator)。模拟每月定投比特币(BTC)、标普500(S&P500)、纳斯达克(Nasdaq)及黄金的历史收益。即时计算总资产、年化收益率(CAGR)与最大回撤，助您做出更聪明的投资决策。',
        [Language.ZH_HANT]: '免費的投資定投計算器 (DCA Simulator)。模擬每月定投比特幣(BTC)、標普500(S&P500)、納斯達克(Nasdaq)及黃金的歷史收益。即時計算總資產、年化收益率(CAGR)與最大回撤，助您做出更聰明的投資決策。',
        [Language.EN]: 'Free DCA Simulator. Backtest monthly investments in Bitcoin (BTC), S&P500, Nasdaq, and Gold. Calculate total value, CAGR, and max drawdown to make smarter investment decisions.'
      };

      document.title = titles[language];
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', descriptions[language]);
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', titles[language]);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', descriptions[language]);
      }

      document.documentElement.lang = language === Language.ZH_HANS ? 'zh-Hans' :
        language === Language.ZH_HANT ? 'zh-Hant' : 'en';
    };

    updateSEO();
  }, [language]);

  // --- Load Asset Configuration from API ---
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsConfigLoading(true);
        console.log('📋 加载资产配置...');
        const res = await fetch(`${API_URL}/api/assets/config`);
        if (res.ok) {
          const config = await res.json();
          setAssetsConfig(config);
          console.log('✅ 资产配置加载成功:', config.length, '个资产');
        } else {
          console.error('❌ 资产配置加载失败');
        }
      } catch (error) {
        console.error('❌ 资产配置加载异常:', error);
      } finally {
        setIsConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  // --- Initialize auth ---
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      await login(ref || undefined);
    };
    init();
  }, []);

  // --- Load user stats after login ---
  useEffect(() => {
    if (user && !stats) {
      checkStatus();
    }
  }, [user, stats, checkStatus]);

  // --- Dynamic Configuration (computed from assetsConfig) ---
  const COLORS = useMemo(() => {
    const colors: Record<string, string> = {};
    assetsConfig.forEach(asset => {
      colors[asset.symbol] = asset.color;
    });
    return colors;
  }, [assetsConfig]);

  const ASSET_GROUPS_CONFIG = useMemo(() => {
    const groups: Record<string, AssetType[]> = {};
    assetsConfig.forEach(asset => {
      if (!groups[asset.group]) {
        groups[asset.group] = [];
      }
      groups[asset.group].push(asset.symbol as AssetType);
    });

    // Sort assets within each group by order
    Object.keys(groups).forEach(groupKey => {
      groups[groupKey].sort((a, b) => {
        const configA = assetsConfig.find(c => c.symbol === a);
        const configB = assetsConfig.find(c => c.symbol === b);
        return (configA?.order || 0) - (configB?.order || 0);
      });
    });

    // Convert to array format expected by UI
    return Object.keys(groups).map(key => ({
      key,
      assets: groups[key]
    }));
  }, [assetsConfig]);

  const FREE_ASSETS = useMemo(() => {
    return assetsConfig
      .filter(asset => asset.isFree)
      .map(asset => asset.symbol as AssetType);
  }, [assetsConfig]);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);

  // Smooth Y-Axis State
  const [yAxisDomainMax, setYAxisDomainMax] = useState<number | null>(null);
  const visualMaxRef = useRef<number>(0);
  const dataMaxRef = useRef<number>(0);

  // --- 加载真实历史数据 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        console.log('🚀 开始加载真实历史数据...');
        const data = await loadHistoricalData();
        setPriceData(data);

        // Check if using CSV fallback
        if (isUsingFallback()) {
          setShowFallbackWarning(true);
          console.warn('⚠️ 当前使用 CSV 兜底数据');
        } else {
          setShowFallbackWarning(false);
        }

        console.log('✅ 真实历史数据加载成功');
      } catch (error) {
        console.error('❌ 加载数据失败:', error);
        setLoadError('无法加载历史数据，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Derived State (Calculations) ---
  const results = useMemo(() => {
    if (priceData.length === 0) return [];
    return activeAssets.map(asset =>
      calculateDCA(priceData, asset, investmentAmount, selectedYears, frequency)
    );
  }, [priceData, selectedYears, activeAssets, investmentAmount, frequency]);

  // Full History Data
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    const baseHistory = results[0].history;
    return baseHistory.map((item, index) => {
      const mergedPoint: any = { date: item.date };
      results.forEach(res => {
        if (res.history[index]) {
          mergedPoint[res.asset] = Math.round(res.history[index].portfolioValue);
        }
      });
      mergedPoint['invested'] = item.invested;
      return mergedPoint;
    });
  }, [results]);

  // --- Animation Logic ---
  useEffect(() => {
    setPlaybackIndex(null);
    setIsPlaying(false);
    setYAxisDomainMax(null);
    visualMaxRef.current = 0;
    dataMaxRef.current = 0;
  }, [selectedYears, activeAssets, investmentAmount, frequency]);

  useEffect(() => {
    // Use 'any' to avoid namespace issues in browser environments
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          const totalPoints = chartData.length;
          const current = prev === null ? 0 : prev;

          if (current >= totalPoints - 1) {
            setIsPlaying(false);
            setYAxisDomainMax(null);
            return null;
          }

          const nextIndex = current + 1;
          const nextDataPoint = chartData[nextIndex];

          if (nextDataPoint) {
            let currentPointMax = 0;
            activeAssets.forEach(asset => {
              const val = nextDataPoint[asset] as number;
              if (val > currentPointMax) currentPointMax = val;
            });

            if (currentPointMax > dataMaxRef.current) {
              dataMaxRef.current = currentPointMax;
            }

            const targetVisualMax = dataMaxRef.current * 1.15;
            const currentVisual = visualMaxRef.current;

            if (currentVisual === 0 && targetVisualMax > 0) {
              visualMaxRef.current = targetVisualMax;
            } else {
              const dist = targetVisualMax - currentVisual;
              visualMaxRef.current = currentVisual + dist * 0.1;
            }

            setYAxisDomainMax(visualMaxRef.current);
          }
          return nextIndex;
        });
      }, 22);
    }
    return () => clearInterval(interval);
  }, [isPlaying, chartData, activeAssets]);

  const handlePlayPause = () => {
    if (playbackIndex === null) {
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
  const totalPoints = chartData.length;
  const currentIndex = playbackIndex === null ? totalPoints - 1 : Math.min(playbackIndex, totalPoints - 1);
  const safeIndex = Math.max(0, currentIndex);

  const displayedChartData = useMemo(() => {
    if (playbackIndex === null) return chartData;
    return chartData.slice(0, safeIndex + 1);
  }, [chartData, playbackIndex, safeIndex]);

  const currentSimulationDate = chartData[safeIndex]?.date || '';

  const currentStats = useMemo(() => {
    return results.map(res => {
      const historyItem = res.history[safeIndex];
      if (!historyItem) return { ...res, roi: 0, totalValue: 0, maxDrawdown: 0, cagr: 0 };

      let localMax = 0;
      let localDD = 0;

      for (let i = 0; i <= safeIndex; i++) {
        const val = res.history[i]?.portfolioValue || 0;
        if (val > localMax) localMax = val;
        const dd = localMax > 0 ? (localMax - val) / localMax : 0;
        if (dd > localDD) localDD = dd;
      }

      const invested = historyItem.invested;
      const val = historyItem.portfolioValue;
      const roi = invested > 0 ? ((val - invested) / invested) * 100 : 0;

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

  const toggleAsset = (asset: AssetType) => {
    if (!isPro) {
      if (!FREE_ASSETS.includes(asset)) {
        setIsAuthModalOpen(true);
        return;
      }
      if (activeAssets.includes(asset)) {
        setActiveAssets(prev => prev.filter(a => a !== asset));
      } else {
        // Free user max assets check: 最多选择3个资产
        if (activeAssets.length >= FREE_MAX_ASSETS) {
          setIsAuthModalOpen(true);
          return;
        }
        setActiveAssets(prev => [...prev, asset]);
      }
    } else {
      setActiveAssets(prev =>
        prev.includes(asset)
          ? prev.filter(a => a !== asset)
          : [...prev, asset]
      );
    }
  };

  const handleYearChange = (year: number) => {
    if (!isPro && !FREE_YEARS_LIMIT.includes(year)) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedYears(year);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // 计算智能的 X 轴刻度点（根据选择的时间范围）
  const getXAxisTicks = useMemo(() => {
    if (chartData.length === 0 || displayedChartData.length === 0) return undefined;

    const startDate = displayedChartData[0]?.date;
    const endDate = displayedChartData[displayedChartData.length - 1]?.date;

    if (!startDate || !endDate) return undefined;

    // 根据选择的年数决定显示密度
    let intervalMonths: number;
    if (selectedYears <= 1) {
      intervalMonths = 1; // 1年以内：每月显示
    } else if (selectedYears <= 3) {
      intervalMonths = 3; // 1-3年：每季度显示
    } else if (selectedYears <= 5) {
      intervalMonths = 6; // 3-5年：每半年显示
    } else {
      intervalMonths = 12; // 5年以上：每年显示
    }

    const ticks: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 从开始日期，按间隔添加刻度点
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    // 创建一个集合来快速查找显示范围内的日期
    const displayedDates = new Set(displayedChartData.map(d => d.date));

    while (current <= end) {
      const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

      // 在完整数据中找到该月份的第一天数据点
      const found = chartData.find(d => d.date.startsWith(yearMonth) && displayedDates.has(d.date));
      if (found) {
        ticks.push(found.date);
      }

      // 移动到下个间隔月份
      current.setMonth(current.getMonth() + intervalMonths);
    }

    // 确保最后一个日期也被包含（如果存在）
    if (endDate && displayedDates.has(endDate) && (!ticks.length || ticks[ticks.length - 1] !== endDate)) {
      ticks.push(endDate);
    }

    return ticks.length > 0 ? ticks : undefined;
  }, [chartData, displayedChartData, selectedYears]);

  // 加载中状态
  if (isLoading || isConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">
            {isConfigLoading ? '正在加载资产配置...' : '正在加载真实历史数据...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {isConfigLoading ? 'Loading asset configuration...' : 'Loading real historical data from Yahoo Finance'}
          </p>
        </div>
      </div>
    );
  }

  // 加载错误状态
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">数据加载失败</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
      {/* CSV Fallback Warning */}
      {showFallbackWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 w-full">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-yellow-800">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>提示：</strong> 当前使用备用数据源（CSV）。API 连接失败，数据可能不是最新。
              <button
                onClick={() => window.location.reload()}
                className="ml-2 underline hover:text-yellow-900"
              >
                点击重试
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
              <span className="text-xs text-gray-500 hidden sm:block">{t.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pro Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${isPro
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-md'
                }`}
            >
              <Crown className="w-4 h-4 fill-current" />
              {isPro ? 'Pro Member' : 'Upgrade Pro'}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Globe className="w-4 h-4 text-gray-400 ml-2 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1 pr-8"
              >
                <option value={Language.ZH_HANT}>繁體</option>
                <option value={Language.ZH_HANS}>简体</option>
                <option value={Language.EN}>English</option>
              </select>
            </div>

            {/* Invite Friends Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-md hover:from-emerald-600 hover:to-teal-700"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.upgrade_pro_modal.invite_title}</span>
              <span className="sm:hidden">邀请</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex justify-center w-full overflow-x-hidden">

        {/* Main Content */}
        <main className="max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-x-hidden">

          {/* Controls Section */}
          <section className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 w-full overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

              {/* Investment Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> {t.amount}
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
                  <Calendar className="w-4 h-4" /> {t.frequency}
                </label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setFrequency(Frequency.MONTHLY)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${frequency === Frequency.MONTHLY
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {t.monthly}
                  </button>
                  <button
                    onClick={() => setFrequency(Frequency.WEEKLY)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${frequency === Frequency.WEEKLY
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {t.weekly}
                  </button>
                </div>
              </div>

              {/* Timeframe Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Settings className="w-4 h-4" /> {t.timeframe}
                </label>
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-hidden">
                  {[1, 3, 5, 10, 15].map(year => {
                    const isLocked = !isPro && !FREE_YEARS_LIMIT.includes(year);
                    return (
                      <button
                        key={year}
                        onClick={() => handleYearChange(year)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap relative ${selectedYears === year
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                          } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {year}{t.year}
                        {isLocked && <Lock className="w-3 h-3 absolute top-1 right-1 text-gray-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Asset Selector (Grouped & Always Expanded) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <PieChart className="w-4 h-4" /> {t.assets_label}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {ASSET_GROUPS_CONFIG.map((group: any) => (
                  <div key={group.key} className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
                    <div className="w-full flex items-center justify-between p-3 bg-white border-b border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {(t.groups && (t.groups as any)[group.key]) || group.key}
                      </h4>
                    </div>

                    <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                      {group.assets.map((asset: AssetType) => {
                        const isLocked = !isPro && !FREE_ASSETS.includes(asset);
                        return (
                          <button
                            key={asset}
                            onClick={() => toggleAsset(asset)}
                            className={`relative flex items-center justify-between px-3 py-2 rounded-md border text-xs font-medium transition-all ${activeAssets.includes(asset)
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-transparent hover:bg-white hover:border-gray-200 text-gray-600'
                              } ${isLocked ? 'opacity-60 grayscale' : ''}`}
                          >
                            <div className="flex items-center gap-2 truncate pr-6 w-full">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[asset] }}></span>
                              <span className="truncate text-left flex-1">{t.assets[asset]}</span>
                            </div>
                            {activeAssets.includes(asset) && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 absolute right-2" />}
                            {isLocked && <Lock className="w-3 h-3 text-gray-400 absolute right-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentStats.map(result => (
              <div key={result.asset} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="font-bold text-gray-800 text-lg truncate pr-2" style={{ color: COLORS[result.asset] }}>
                    {t.assets[result.asset].split('(')[0]}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-300 ${result.roi >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">{t.stats.total_value}</span>
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
                      <span className="text-gray-400 text-xs">{t.stats.invested}</span>
                      <span className="font-medium text-gray-700 transition-all duration-300">${result.totalInvested.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400 text-xs">{t.stats.drawdown}</span>
                      <span className="font-medium text-red-500 transition-all duration-300">
                        -{result.maxDrawdown.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs">{t.stats.cagr}</span>
                      <span className={`font-medium transition-all duration-300 ${result.cagr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {result.cagr.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400 text-xs">{t.stats.roi}</span>
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
          <section className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 w-full">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                {t.chart_title}
              </h3>

              <div className="flex items-center gap-2 sm:gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-full hover:bg-white hover:shadow-sm text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    title={isPlaying ? t.pause : t.play}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                    title={t.reset}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-md border border-gray-200 shadow-sm min-w-[140px] justify-center">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-mono font-medium text-gray-700">
                    {currentSimulationDate || 'YYYY-MM-DD'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <LineChart
                  data={displayedChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 5,
                    bottom: 50
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9CA3AF', angle: -45, textAnchor: 'end', dy: 5 }}
                    ticks={getXAxisTicks}
                    tickFormatter={(val) => {
                      // 显示简化的年月格式: YY/MM (如 23/11)
                      if (!val) return '';
                      const dateStr = val.toString();
                      if (dateStr.length >= 7) {
                        const year = dateStr.slice(2, 4); // 取年份后两位
                        const month = dateStr.slice(5, 7); // 取月份
                        return `${year}/${month}`; // 返回 YY/MM
                      }
                      if (dateStr.length >= 4) {
                        return dateStr.slice(2, 4); // 备用：只显示年份后两位
                      }
                      return dateStr;
                    }}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                      return `$${val}`;
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={8}
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
                    formatter={(value: number, name: string) => {
                      if (name === 'invested') return [`$${value.toLocaleString()}`, t.stats.total_invested_legend];
                      // Try to map back code to name, or use as is
                      const assetKey = Object.keys(COLORS).find(k => k === name) as AssetType | undefined;
                      const displayName = assetKey ? t.assets[assetKey].split('(')[0] : name;
                      return [`$${value.toLocaleString()}`, displayName];
                    }}
                    labelFormatter={(label) => `${label}`}
                    labelStyle={{ color: '#6B7280', marginBottom: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => {
                      if (value === 'invested') return t.stats.total_invested_legend;
                      const assetKey = value as AssetType;
                      return t.assets[assetKey] ? t.assets[assetKey].split('(')[0] : value;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="#9CA3AF"
                    strokeDasharray="4 4"
                    dot={false}
                    strokeWidth={2}
                    name="invested"
                    isAnimationActive={false}
                  />

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
                      name={asset}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-1">
            <Info className="w-3 h-3" />
            <span>{t.source}</span>
          </div>

          {/* Invite Friends Section */}
          <section className="mt-12 mb-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">{t.upgrade_pro_modal.invite_title}</h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-200"></div>
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-800">{t.upgrade_pro_modal.invite_title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {t.upgrade_pro_modal.invite_desc}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">1人</div>
                    <div className="text-sm text-gray-600">获得1天会员</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">2人</div>
                    <div className="text-sm text-gray-600">累计2天会员</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-600 mb-1 flex items-center justify-center gap-1">
                      3人 <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="text-sm font-semibold text-indigo-700">升级永久会员！</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAuthModalTab('invite');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t.upgrade_pro_modal.generate_link}
                </button>
              </div>
            </div>
          </section>

          {/* Pricing & Features Section */}
          <section className="mt-12 mb-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">{t.features_title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200"></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t.free_plan}</h3>
                <div className="text-3xl font-bold text-gray-900 mb-6">{t.price_free} <span className="text-sm font-normal text-gray-500">{t.price_free_period}</span></div>
                <ul className="space-y-4 mb-8">
                  {(t.free_features as string[]).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-center font-medium cursor-default">
                  {t.activation_status}: {isPro ? t.status_inactive : t.status_active}
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl relative overflow-hidden transform md:-translate-y-2">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Recommended
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  {t.pro_plan} <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-6">{t.price_pro} <span className="text-sm font-normal text-gray-500">{t.price_pro_period}</span></div>
                <ul className="space-y-4 mb-8">
                  {(t.pro_features as string[]).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isPro ? (
                  <div className="w-full py-3 px-4 rounded-lg bg-green-100 text-green-700 border border-green-200 text-center font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> {t.status_active}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalTab('upgrade');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-200"
                  >
                    {t.upgrade_pro}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 py-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
              <a href="/privacy-policy.html" className="hover:text-gray-900">Privacy Policy</a>
              <a href="/terms-of-service.html" className="hover:text-gray-900">Terms of Service</a>
              <a href="/refund-policy.html" className="hover:text-gray-900">Refund Policy</a>
              <a href="/contact.html" className="hover:text-gray-900">Contact</a>
              <a
                href="https://x.com/sonic_yann"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-gray-900"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>@sonic_yann</span>
              </a>
            </div>
            <p>© {new Date().getFullYear()} DCA Simulator. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-400">
              Disclaimer: This tool is for informational purposes only and does not constitute financial advice.
              Past performance is not indicative of future results.
            </p>
          </footer>

        </main>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        initialTab={authModalTab}
      />
    </div>
  );
};

export default App;