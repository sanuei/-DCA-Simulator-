/**
 * 数据加载工具
 * 优先从 API 加载数据，仅在 API 完全失败时回退到 CSV 文件（应急兜底）
 */

import { AssetType, PriceData } from '../types';

// API URL (Can be overridden by env var)
const API_URL = import.meta.env.VITE_API_URL || 'https://dca-simulator-api.sonic980828.workers.dev';
const CSV_PATH = './data/all_assets.csv';

// Track whether we're using CSV fallback (for UI warning)
let isUsingCSVFallback = false;

/**
 * 解析 CSV 字符串为数据数组
 */
function parseCSV(csvText: string): PriceData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const data: PriceData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: PriceData = { date: values[0] };
    
    for (let j = 1; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];
      
      if (value && value !== '' && value !== 'NaN') {
        row[header] = parseFloat(value);
      }
    }
    data.push(row);
  }
  return data;
}

/**
 * 加载历史数据
 * 优先级：API > CSV（应急兜底）
 */
export async function loadHistoricalData(): Promise<PriceData[]> {
  isUsingCSVFallback = false;
  
  // 1. 优先尝试从 API 加载（推荐方式）
  try {
    console.log('📥 正在从 API 加载最新历史数据...');
    const apiRes = await fetch(`${API_URL}/api/assets/data`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (apiRes.ok) {
        const jsonData = await apiRes.json();
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            console.log(`✅ API 数据加载成功: ${jsonData.length} 条记录`);
            console.log(`   数据来源: Cloudflare KV (最新)`);
            return jsonData;
        } else {
            console.warn('⚠️ API 返回空数据，回退到 CSV...');
        }
    } else {
        console.warn(`⚠️ API 请求失败 (${apiRes.status})，回退到 CSV...`);
    }
  } catch (e) {
    console.error('⚠️ API 连接失败，回退到 CSV...', e);
  }

  // 2. CSV 兜底（仅在 API 完全失败时使用）
  isUsingCSVFallback = true;
  console.warn('⚠️ 正在使用 CSV 兜底数据（数据可能不是最新）');
  
  try {
    console.log('📥 正在加载本地 CSV 数据...');
    const response = await fetch(CSV_PATH);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    const filteredData = data.filter(row => row[AssetType.SP500] !== undefined);
    console.log(`✅ CSV 数据加载完成: ${filteredData.length} 条记录`);
    console.warn(`⚠️ 注意: 当前使用的是静态 CSV 数据，不是实时更新`);
    
    return filteredData;
  } catch (error) {
    console.error('❌ CSV 数据加载也失败，无法加载历史数据:', error);
    throw new Error('无法加载历史数据：API 和 CSV 均失败');
  }
}

/**
 * 检查是否正在使用 CSV 兜底数据
 */
export function isUsingFallback(): boolean {
  return isUsingCSVFallback;
}

export function getAssetStartDate(data: PriceData[], asset: AssetType): string | null {
  for (const row of data) {
    if (row[asset] !== undefined && !isNaN(row[asset] as number)) {
      return row.date;
    }
  }
  return null;
}
