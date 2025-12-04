/**
 * 数据加载工具
 * 从 CSV 文件加载真实历史价格数据
 */

import { AssetType, PriceData } from '../types';

// CSV 文件路径
const DATA_PATH = '/data/all_assets.csv';

/**
 * 解析 CSV 字符串为数据数组
 */
function parseCSV(csvText: string): PriceData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.error('CSV 文件为空或格式错误');
    return [];
  }

  // 解析表头
  const headers = lines[0].split(',');
  
  // 解析数据行
  const data: PriceData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: PriceData = { date: values[0] };
    
    for (let j = 1; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];
      
      // 处理空值和数字转换
      if (value && value !== '' && value !== 'NaN') {
        row[header] = parseFloat(value);
      }
    }
    
    data.push(row);
  }

  console.log(`📊 成功加载 ${data.length} 条历史价格数据`);
  return data;
}

/**
 * 从服务器加载 CSV 数据
 */
export async function loadHistoricalData(): Promise<PriceData[]> {
  try {
    console.log('📥 正在加载真实历史数据...');
    
    const response = await fetch(DATA_PATH);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    // 过滤掉没有足够数据的早期日期
    // 确保至少有主要资产的数据
    const filteredData = data.filter(row => {
      // 至少要有 SP500 和一个加密货币的数据
      return row[AssetType.SP500] !== undefined;
    });

    console.log(`✅ 数据加载完成，有效记录: ${filteredData.length} 条`);
    console.log(`   日期范围: ${filteredData[0]?.date} ~ ${filteredData[filteredData.length - 1]?.date}`);
    
    return filteredData;
  } catch (error) {
    console.error('❌ 加载历史数据失败:', error);
    throw error;
  }
}

/**
 * 获取特定资产的可用数据起始日期
 */
export function getAssetStartDate(data: PriceData[], asset: AssetType): string | null {
  for (const row of data) {
    if (row[asset] !== undefined && !isNaN(row[asset] as number)) {
      return row.date;
    }
  }
  return null;
}

/**
 * 获取数据统计信息
 */
export function getDataStats(data: PriceData[]): Record<string, { startDate: string; endDate: string; count: number }> {
  const stats: Record<string, { startDate: string; endDate: string; count: number }> = {};
  
  const assets = Object.values(AssetType);
  
  for (const asset of assets) {
    let startDate: string | null = null;
    let endDate: string | null = null;
    let count = 0;
    
    for (const row of data) {
      if (row[asset] !== undefined && !isNaN(row[asset] as number)) {
        if (!startDate) startDate = row.date;
        endDate = row.date;
        count++;
      }
    }
    
    if (startDate && endDate) {
      stats[asset] = { startDate, endDate, count };
    }
  }
  
  return stats;
}

