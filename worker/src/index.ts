import { Hono } from 'hono';
import type { ExecutionContext } from '@cloudflare/workers-types';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { Bindings, User, ActivationCode, UserStats, AssetConfig } from './types';
import { adminAuth, userAuth } from './middleware';
import { jsonResponse, errorResponse, generateId, generateCode } from './utils';

const app = new Hono<{ Bindings: Bindings, Variables: { userId: string } }>();

app.use('/*', cors());

// --- Default Asset Configuration ---
// This is used to initialize the system on first deployment
const DEFAULT_ASSETS: AssetConfig[] = [
  // Crypto
  { symbol: 'BTC', yahooSymbol: 'BTC-USD', name: '比特幣 (BTC)', type: 'crypto', color: '#F7931A', group: 'crypto', isFree: true, order: 1 },
  { symbol: 'ETH', yahooSymbol: 'ETH-USD', name: '以太坊 (ETH)', type: 'crypto', color: '#627EEA', group: 'crypto', isFree: true, order: 2 },
  { symbol: 'SOL', yahooSymbol: 'SOL-USD', name: 'Solana (SOL)', type: 'crypto', color: '#14F195', group: 'crypto', isFree: false, order: 3 },
  { symbol: 'BNB', yahooSymbol: 'BNB-USD', name: '幣安幣 (BNB)', type: 'crypto', color: '#F3BA2F', group: 'crypto', isFree: false, order: 4 },
  { symbol: 'XRP', yahooSymbol: 'XRP-USD', name: '瑞波幣 (XRP)', type: 'crypto', color: '#23292F', group: 'crypto', isFree: false, order: 5 },
  { symbol: 'ADA', yahooSymbol: 'ADA-USD', name: '艾達幣 (ADA)', type: 'crypto', color: '#0033AD', group: 'crypto', isFree: false, order: 6 },
  { symbol: 'DOGE', yahooSymbol: 'DOGE-USD', name: '狗狗幣 (DOGE)', type: 'crypto', color: '#C2A633', group: 'crypto', isFree: false, order: 7 },
  
  // Indices
  { symbol: 'SP500', yahooSymbol: '^GSPC', name: '標普500 (S&P500)', type: 'index', color: '#10B981', group: 'indices', isFree: true, order: 1 },
  { symbol: 'NASDAQ', yahooSymbol: '^IXIC', name: '納斯達克 (Nasdaq)', type: 'index', color: '#0EA5E9', group: 'indices', isFree: true, order: 2 },
  { symbol: 'CSI300', yahooSymbol: '000300.SS', name: '滬深300 (China)', type: 'index', color: '#EF4444', group: 'indices', isFree: false, order: 3 },
  { symbol: 'HSI', yahooSymbol: '^HSI', name: '恆生指數 (HK)', type: 'index', color: '#8B5CF6', group: 'indices', isFree: false, order: 4 },
  { symbol: 'NIKKEI', yahooSymbol: '^N225', name: '日經225 (Japan)', type: 'index', color: '#64748B', group: 'indices', isFree: false, order: 5 },
  
  // Tech Stocks
  { symbol: 'AAPL', yahooSymbol: 'AAPL', name: '蘋果 (AAPL)', type: 'stock', color: '#A3AAAE', group: 'tech', isFree: true, order: 1 },
  { symbol: 'MSFT', yahooSymbol: 'MSFT', name: '微軟 (MSFT)', type: 'stock', color: '#F25022', group: 'tech', isFree: false, order: 2 },
  { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: '谷歌 (GOOGL)', type: 'stock', color: '#4285F4', group: 'tech', isFree: false, order: 3 },
  { symbol: 'AMZN', yahooSymbol: 'AMZN', name: '亞馬遜 (AMZN)', type: 'stock', color: '#FF9900', group: 'tech', isFree: false, order: 4 },
  { symbol: 'META', yahooSymbol: 'META', name: 'Meta (META)', type: 'stock', color: '#0668E1', group: 'tech', isFree: false, order: 5 },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', name: '輝達 (NVDA)', type: 'stock', color: '#76B900', group: 'tech', isFree: true, order: 6 },
  { symbol: 'TSLA', yahooSymbol: 'TSLA', name: '特斯拉 (TSLA)', type: 'stock', color: '#E31937', group: 'tech', isFree: true, order: 7 },
  { symbol: 'NFLX', yahooSymbol: 'NFLX', name: 'Netflix (NFLX)', type: 'stock', color: '#E50914', group: 'tech', isFree: false, order: 8 },
  { symbol: 'AMD', yahooSymbol: 'AMD', name: 'AMD (AMD)', type: 'stock', color: '#ED1C24', group: 'tech', isFree: false, order: 9 },
  { symbol: 'INTC', yahooSymbol: 'INTC', name: '英特爾 (INTC)', type: 'stock', color: '#0071C5', group: 'tech', isFree: false, order: 10 },
  { symbol: 'V', yahooSymbol: 'V', name: 'Visa (V)', type: 'stock', color: '#1A1F71', group: 'tech', isFree: false, order: 11 },
  { symbol: 'JNJ', yahooSymbol: 'JNJ', name: '強生 (JNJ)', type: 'stock', color: '#D51920', group: 'tech', isFree: false, order: 12 },
  { symbol: 'PFE', yahooSymbol: 'PFE', name: '輝瑞 (PFE)', type: 'stock', color: '#0093D0', group: 'tech', isFree: false, order: 13 },
  { symbol: 'PG', yahooSymbol: 'PG', name: '寶潔 (PG)', type: 'stock', color: '#003DA5', group: 'tech', isFree: false, order: 14 },
  
  // Commodities
  { symbol: 'GOLD', yahooSymbol: 'GC=F', name: '黃金 (Gold)', type: 'commodity', color: '#FFD700', group: 'commodities', isFree: true, order: 1 },
  { symbol: 'SILVER', yahooSymbol: 'SI=F', name: '白銀 (Silver)', type: 'commodity', color: '#C0C0C0', group: 'commodities', isFree: false, order: 2 },
  { symbol: 'OIL', yahooSymbol: 'CL=F', name: '原油 (Oil)', type: 'commodity', color: '#4B5563', group: 'commodities', isFree: false, order: 3 },
];

// --- Yahoo Finance Helper ---
async function fetchYahooData(symbol: string, range: string = '1mo', interval: string = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}: ${res.statusText}`);
  return await res.json();
}

// --- Data Management Helper ---
async function updateAssetData(env: Bindings, assets: AssetConfig[], range: string = '1mo') {
    // 1. Fetch current data from KV
    let currentData: any[] = [];
    try {
        const raw = await env.DCA_DATA.get('historical_data');
        if (raw) currentData = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse existing data', e);
    }

    // Map by date for easy merging: { "2023-01-01": { date: "2023-01-01", BTC: 100, ... } }
    const dataMap: Record<string, any> = {};
    currentData.forEach(row => {
        if (row.date) dataMap[row.date] = row;
    });

    // 2. Fetch new data for each asset
    for (const asset of assets) {
        try {
            const yData: any = await fetchYahooData(asset.yahooSymbol, range);
            const result = yData.chart.result[0];
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];
            const closes = quote.close;

            if (timestamps && closes) {
                timestamps.forEach((ts: number, i: number) => {
                    if (closes[i] === null || closes[i] === undefined) return;
                    
                    const date = new Date(ts * 1000).toISOString().split('T')[0];
                    if (!dataMap[date]) {
                        dataMap[date] = { date };
                    }
                    dataMap[date][asset.symbol] = parseFloat(closes[i].toFixed(2));
                });
            }
        } catch (e) {
            console.error(`Error updating ${asset.symbol}:`, e);
        }
    }

    // 3. Convert back to array and sort
    const mergedData = Object.values(dataMap).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 4. Save to KV
    await env.DCA_DATA.put('historical_data', JSON.stringify(mergedData));
    return mergedData.length;
}


// --- Admin Routes for Data ---

// Get Asset Config
app.get('/api/admin/assets/config', adminAuth, async (c) => {
    const raw = await c.env.DCA_DATA.get('assets_config');
    const config: AssetConfig[] = raw ? JSON.parse(raw) : [];
    return jsonResponse(c, { config });
});

// Save Asset Config
app.post('/api/admin/assets/config', adminAuth, async (c) => {
    const { config } = await c.req.json<{ config: AssetConfig[] }>();
    await c.env.DCA_DATA.put('assets_config', JSON.stringify(config));
    return jsonResponse(c, { success: true });
});

// Trigger Manual Update
app.post('/api/admin/assets/update-data', adminAuth, async (c) => {
    const { range } = await c.req.json<{ range?: string }>();
    
    const rawConfig = await c.env.DCA_DATA.get('assets_config');
    if (!rawConfig) return errorResponse(c, 'No asset config found', 400);
    
    const config: AssetConfig[] = JSON.parse(rawConfig);
    
    // Default range is 1mo if updating, but for initial load user might want '10y' or 'max'
    const updateRange = range || '1mo'; 

    const count = await updateAssetData(c.env, config, updateRange);
    
    return jsonResponse(c, { success: true, count, message: `Updated data for ${config.length} assets over ${updateRange}` });
});

// Upload historical data directly (for CSV import)
app.post('/api/admin/assets/upload-data', adminAuth, async (c) => {
    try {
        const { data } = await c.req.json<{ data: any[] }>();
        
        if (!Array.isArray(data)) {
            return errorResponse(c, 'Data must be an array', 400);
        }
        
        await c.env.DCA_DATA.put('historical_data', JSON.stringify(data));
        
        return jsonResponse(c, { 
            success: true, 
            count: data.length, 
            message: `Uploaded ${data.length} data records to KV` 
        });
    } catch (e: any) {
        return errorResponse(c, e.message || 'Upload failed', 500);
    }
});


// --- Public Routes for Data ---

// Get Asset Configuration (Public - for frontend)
app.get('/api/assets/config', async (c) => {
    let config = await c.env.DCA_DATA.get('assets_config');
    
    // Parse and validate config
    let parsedConfig: AssetConfig[] = [];
    
    if (config) {
        try {
            parsedConfig = JSON.parse(config);
        } catch (e) {
            console.error('Failed to parse config, reinitializing...');
        }
    }
    
    // Initialize with default config if not found OR empty
    if (!parsedConfig || parsedConfig.length === 0) {
        console.log('No asset config found or empty, initializing with defaults...');
        await c.env.DCA_DATA.put('assets_config', JSON.stringify(DEFAULT_ASSETS));
        parsedConfig = DEFAULT_ASSETS;
    } else {
        // Ensure AAPL, NVDA, TSLA are free (update if needed)
        let needsUpdate = false;
        const freeTechStocks = ['AAPL', 'NVDA', 'TSLA'];
        
        parsedConfig = parsedConfig.map(asset => {
            if (freeTechStocks.includes(asset.symbol) && !asset.isFree) {
                needsUpdate = true;
                return { ...asset, isFree: true };
            }
            return asset;
        });
        
        // Also ensure these stocks exist in config (in case they were removed)
        const existingSymbols = parsedConfig.map(a => a.symbol);
        freeTechStocks.forEach(symbol => {
            if (!existingSymbols.includes(symbol)) {
                const defaultAsset = DEFAULT_ASSETS.find(a => a.symbol === symbol);
                if (defaultAsset) {
                    parsedConfig.push({ ...defaultAsset, isFree: true });
                    needsUpdate = true;
                }
            }
        });
        
        if (needsUpdate) {
            console.log('Updating free tech stocks configuration...');
            await c.env.DCA_DATA.put('assets_config', JSON.stringify(parsedConfig));
        }
    }
    
    return c.json(parsedConfig);
});

app.get('/api/assets/data', async (c) => {
    // Try KV first
    const data = await c.env.DCA_DATA.get('historical_data');
    if (data) {
        // Return as stream or json? JSON is fine for < 25MB
        return c.json(JSON.parse(data));
    }
    return c.json([]);
});


// --- Scheduled Event (Cron) ---
// Note: Hono doesn't directly handle `scheduled` event exports in the same way as fetch.
// We need to export a separate handler or use a specific Hono adapter.
// For standard Cloudflare Workers, we export a `scheduled` function.

// We will keep the fetch handler (app.fetch) and add the scheduled handler separately below.


// --- Existing Routes (Keep them) ---

// Search Assets Proxy
app.get('/api/finance/search', async (c) => {
  const query = c.req.query('q');
  if (!query) return errorResponse(c, 'Query required', 400);

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    console.error('Yahoo Search Error:', e);
    return errorResponse(c, 'Failed to fetch from Yahoo', 500);
  }
});

// Get Historical Data (Individual - for charts/details if needed)
app.get('/api/finance/history/:symbol', userAuth, async (c) => {
  const symbol = c.req.param('symbol');
  const interval = c.req.query('interval') || '1d';
  const range = c.req.query('range') || '10y';

  const userId = c.get('userId');
  const user = await c.env.DCA_USERS.get<User>(`user:${userId}`, 'json');
  if (!user || user.tier !== 'pro') {
    return errorResponse(c, 'Pro subscription required', 403);
  }

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`);
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    console.error('Yahoo History Error:', e);
    return errorResponse(c, 'Failed to fetch history', 500);
  }
});


// Generate Activation Codes
app.post('/api/code/generate', adminAuth, async (c) => {
  const { type, durationDays, count } = await c.req.json<{ type: string, durationDays: number, count?: number }>();
  
  const qty = count || 1;
  const codes: string[] = [];
  const now = Date.now();

  for (let i = 0; i < qty; i++) {
    const codeStr = generateCode();
    const codeData: ActivationCode = {
      code: codeStr,
      status: 'unused',
      type: type as any || 'pro_monthly',
      durationDays: durationDays || 30,
      createdAt: now,
    };
    
    const existing = await c.env.DCA_CODES.get(codeStr);
    if (existing) {
      i--; 
      continue;
    }

    await c.env.DCA_CODES.put(`code:${codeStr}`, JSON.stringify(codeData));
    codes.push(codeStr);
  }

  return jsonResponse(c, { codes });
});

// Admin Stats
app.get('/api/admin/dashboard-stats', adminAuth, async (c) => {
  const userList = await c.env.DCA_USERS.list({ prefix: 'user:', limit: 1000 });
  const totalUsers = userList.keys.length;
  const codeList = await c.env.DCA_CODES.list({ prefix: 'code:', limit: 1000 });
  return jsonResponse(c, {
    totalUsers,
    totalCodes: codeList.keys.length,
  });
});

// Admin - List Users
app.get('/api/admin/users', adminAuth, async (c) => {
  const cursor = c.req.query('cursor');
  const limit = 20;
  const list = await c.env.DCA_USERS.list({ prefix: 'user:', limit, cursor });
  
  const users: User[] = [];
  for (const key of list.keys) {
    if (key.name.endsWith(':stats') || key.name.endsWith(':refCode')) continue;
    const u = await c.env.DCA_USERS.get<User>(key.name, 'json');
    if (u) users.push(u);
  }

  return jsonResponse(c, { users, cursor: list.cursor, list_complete: list.list_complete });
});

// Admin - List Codes
app.get('/api/admin/codes', adminAuth, async (c) => {
  const cursor = c.req.query('cursor');
  const limit = 20;
  const list = await c.env.DCA_CODES.list({ prefix: 'code:', limit, cursor });
  
  const codes: ActivationCode[] = [];
  for (const key of list.keys) {
    const code = await c.env.DCA_CODES.get<ActivationCode>(key.name, 'json');
    if (code) codes.push(code);
  }

  return jsonResponse(c, { codes, cursor: list.cursor, list_complete: list.list_complete });
});

// Login
app.post('/api/auth/login', async (c) => {
  const { deviceId, referralCode } = await c.req.json<{ deviceId?: string, referralCode?: string }>();
  
  if (!deviceId) return errorResponse(c, 'Device ID required', 400);

  let user = await c.env.DCA_USERS.get<User>(`user:${deviceId}`, 'json');
  const now = Date.now();
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: deviceId,
      tier: 'free',
      createdAt: now,
    };

    if (referralCode) {
      const referrerId = await c.env.DCA_REFERRALS.get(`referral:${referralCode}`);
      if (referrerId && referrerId !== deviceId) {
        user.invitedBy = referrerId;
        const referrerStatsKey = `user:${referrerId}:stats`;
        const stats = await c.env.DCA_USERS.get<UserStats>(referrerStatsKey, 'json') || { inviteCount: 0, rewardDays: 0 };
        stats.inviteCount += 1;
        
        // 获取邀请人的用户信息
        const referrer = await c.env.DCA_USERS.get<User>(`user:${referrerId}`, 'json');
        if (referrer) {
          // 如果邀请人数达到3人，升级为永久会员
          if (stats.inviteCount >= 3) {
            referrer.tier = 'pro';
            referrer.expireAt = undefined; // 永久会员，无过期时间
          } else {
            // 否则奖励1天会员资格（可叠加）
            const oneDayMs = 24 * 60 * 60 * 1000;
            const currentExpiry = (referrer.tier === 'pro' && referrer.expireAt) ? referrer.expireAt : Date.now();
            const baseTime = (currentExpiry > Date.now()) ? currentExpiry : Date.now();
            
            referrer.tier = 'pro';
            referrer.expireAt = baseTime + oneDayMs;
          }
          
          await c.env.DCA_USERS.put(`user:${referrerId}`, JSON.stringify(referrer));
        }
        
        await c.env.DCA_USERS.put(referrerStatsKey, JSON.stringify(stats));
      }
    }

    await c.env.DCA_USERS.put(`user:${deviceId}`, JSON.stringify(user));
  }

  const token = await sign({ sub: user.id, role: 'user', iat: Math.floor(now / 1000) }, c.env.JWT_SECRET);

  return jsonResponse(c, { token, user, isNewUser });
});

// Get User Info
app.get('/api/user/me', userAuth, async (c) => {
  const userId = c.get('userId');
  const user = await c.env.DCA_USERS.get<User>(`user:${userId}`, 'json');
  
  if (!user) return errorResponse(c, 'User not found', 404);
  
  if (user.tier === 'pro' && user.expireAt && user.expireAt < Date.now()) {
    user.tier = 'free';
    user.expireAt = undefined;
    await c.env.DCA_USERS.put(`user:${userId}`, JSON.stringify(user));
  }

  const stats = await c.env.DCA_USERS.get<UserStats>(`user:${userId}:stats`, 'json') || { inviteCount: 0, rewardDays: 0 };

  return jsonResponse(c, { user, stats });
});

// Redeem Code
app.post('/api/code/redeem', userAuth, async (c) => {
  const { code } = await c.req.json<{ code: string }>();
  const userId = c.get('userId');

  if (!code) return errorResponse(c, 'Code required', 400);

  const codeKey = `code:${code}`;
  const codeData = await c.env.DCA_CODES.get<ActivationCode>(codeKey, 'json');

  if (!codeData) return errorResponse(c, 'Invalid code', 404);
  if (codeData.status === 'used') return errorResponse(c, 'Code already used', 400);

  codeData.status = 'used';
  codeData.usedBy = userId;
  codeData.usedAt = Date.now();
  await c.env.DCA_CODES.put(codeKey, JSON.stringify(codeData));

  const user = await c.env.DCA_USERS.get<User>(`user:${userId}`, 'json');
  if (!user) return errorResponse(c, 'User not found', 404);

  const durationMs = codeData.durationDays * 24 * 60 * 60 * 1000;
  const currentExpiry = (user.tier === 'pro' && user.expireAt) ? user.expireAt : Date.now();
  const baseTime = (currentExpiry > Date.now()) ? currentExpiry : Date.now();
  
  user.tier = 'pro';
  user.expireAt = baseTime + durationMs;

  await c.env.DCA_USERS.put(`user:${userId}`, JSON.stringify(user));

  return jsonResponse(c, { success: true, user });
});

// Create Referral
app.post('/api/referral/create', userAuth, async (c) => {
  const userId = c.get('userId');
  let refCode = await c.env.DCA_USERS.get(`user:${userId}:refCode`);
  if (!refCode) {
    refCode = generateCode(6);
    while (await c.env.DCA_REFERRALS.get(`referral:${refCode}`)) {
      refCode = generateCode(6);
    }
    await c.env.DCA_REFERRALS.put(`referral:${refCode}`, userId);
    await c.env.DCA_USERS.put(`user:${userId}:refCode`, refCode);
  }
  return jsonResponse(c, { referralCode: refCode });
});

// #region agent log
// Add root path handler for health check
app.get('/', async (c) => {
  fetch('http://127.0.0.1:7245/ingest/b0325a71-d6a6-49b4-aae8-cccb2a6eb4b3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'worker/src/index.ts:501',message:'Root path accessed',data:{path:c.req.path,method:c.req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  return c.json({ 
    service: 'DCA Simulator API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      config: '/api/assets/config',
      data: '/api/assets/data',
      login: '/api/auth/login'
    }
  });
});
// #endregion

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings, ctx: ExecutionContext) {
    console.log('⏰ Scheduled Event Triggered');
    
    // Get config
    const rawConfig = await env.DCA_DATA.get('assets_config');
    if (!rawConfig) {
        console.log('No asset config found, skipping update.');
        return;
    }
    const config: AssetConfig[] = JSON.parse(rawConfig);
    
    // Update data (last 1 month is usually enough for daily/monthly cron)
    const count = await updateAssetData(env, config, '1mo');
    console.log(`✅ Updated ${count} records.`);
  }
};
