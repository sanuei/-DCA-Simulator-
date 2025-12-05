#!/usr/bin/env python3
"""
下载历史价格数据脚本
使用 yfinance 从 Yahoo Finance 获取真实历史数据并保存为 CSV 格式
"""

import os
import sys
from datetime import datetime, timedelta

try:
    import yfinance as yf
    import pandas as pd
except ImportError:
    print("正在安装必要的依赖...")
    os.system("pip install yfinance pandas")
    import yfinance as yf
    import pandas as pd

# 资产代码映射 (应用内代码 -> Yahoo Finance 代码)
ASSET_TICKERS = {
    # 加密货币
    "BTC": "BTC-USD",      # 比特币
    "ETH": "ETH-USD",      # 以太坊
    "SOL": "SOL-USD",      # Solana
    "BNB": "BNB-USD",      # Binance Coin
    "XRP": "XRP-USD",      # Ripple
    "ADA": "ADA-USD",      # Cardano
    "DOGE": "DOGE-USD",    # 狗狗币
    
    # 指数
    "SP500": "^GSPC",      # S&P 500
    "NASDAQ": "^IXIC",     # Nasdaq Composite
    "CSI300": "510300.SS", # 沪深300 ETF (使用ETF获取更早的历史数据，从2012年开始)
    "HSI": "^HSI",         # 恒生指数
    "NIKKEI": "^N225",     # 日经225
    
    # 美股科技巨头
    "AAPL": "AAPL",        # 苹果
    "MSFT": "MSFT",        # 微软
    "GOOGL": "GOOGL",      # Google (Alphabet)
    "AMZN": "AMZN",        # 亚马逊
    "META": "META",        # Meta (Facebook)
    "NVDA": "NVDA",        # 英伟达
    "TSLA": "TSLA",        # 特斯拉
    "NFLX": "NFLX",        # Netflix
    "AMD": "AMD",          # AMD
    "INTC": "INTC",        # Intel
    "V": "V",              # Visa
    "JNJ": "JNJ",          # 强生
    "PFE": "PFE",          # 辉瑞
    "PG": "PG",            # 宝洁
    
    # 商品
    "GOLD": "GC=F",        # 黄金期货
    "SILVER": "SI=F",      # 白银期货
    "OIL": "CL=F",         # 原油期货
}

def download_asset_data(asset_code: str, ticker: str, years: int = 15) -> pd.DataFrame:
    """
    下载单个资产的历史数据
    
    Args:
        asset_code: 应用内使用的资产代码
        ticker: Yahoo Finance 股票代码
        years: 下载多少年的数据
    
    Returns:
        包含日期和收盘价的 DataFrame
    """
    print(f"📥 正在下载 {asset_code} ({ticker}) 的历史数据...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years * 365)
    
    try:
        # 下载数据
        data = yf.download(
            ticker,
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
            progress=False
        )
        
        if data.empty:
            print(f"⚠️ {asset_code}: 没有获取到数据")
            return pd.DataFrame()
        
        # 只保留日期和收盘价
        df = pd.DataFrame()
        df["date"] = data.index.strftime("%Y-%m-%d")
        df["close"] = data["Close"].values
        
        # 重置索引
        df = df.reset_index(drop=True)
        
        print(f"✅ {asset_code}: 获取了 {len(df)} 条记录 ({df['date'].iloc[0]} ~ {df['date'].iloc[-1]})")
        return df
        
    except Exception as e:
        print(f"❌ {asset_code}: 下载失败 - {str(e)}")
        return pd.DataFrame()


def main():
    """主函数：下载所有资产数据并保存为 CSV"""
    
    # 创建数据目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, "public", "data")
    
    os.makedirs(data_dir, exist_ok=True)
    print(f"📁 数据将保存到: {data_dir}\n")
    
    # 下载所有资产数据
    all_data = {}
    
    for asset_code, ticker in ASSET_TICKERS.items():
        df = download_asset_data(asset_code, ticker)
        if not df.empty:
            # 保存单个资产的 CSV
            csv_path = os.path.join(data_dir, f"{asset_code}.csv")
            df.to_csv(csv_path, index=False)
            all_data[asset_code] = df
    
    print(f"\n{'='*50}")
    print(f"✅ 数据下载完成！共下载了 {len(all_data)} 个资产的数据")
    print(f"📁 CSV 文件位置: {data_dir}")
    
    # 创建合并的数据文件（所有资产按日期对齐）
    if all_data:
        print("\n📊 正在创建合并数据文件...")
        
        # 找到所有资产的共同日期范围
        merged = None
        for asset_code, df in all_data.items():
            df_renamed = df.rename(columns={"close": asset_code})
            if merged is None:
                merged = df_renamed
            else:
                merged = pd.merge(merged, df_renamed, on="date", how="outer")
        
        # 按日期排序
        merged = merged.sort_values("date").reset_index(drop=True)
        
        # 前向填充缺失值（假期等）
        merged = merged.ffill()
        
        # 保存合并文件
        merged_path = os.path.join(data_dir, "all_assets.csv")
        merged.to_csv(merged_path, index=False)
        print(f"✅ 合并数据已保存: {merged_path}")
        print(f"   共 {len(merged)} 条记录，{len(merged.columns) - 1} 个资产")


if __name__ == "__main__":
    main()

