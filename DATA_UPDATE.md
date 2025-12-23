# 📊 数据更新文档

本文档详细说明如何更新 DCA Simulator 的历史价格数据。

---

## 📍 数据来源

所有历史价格数据来自 **[Yahoo Finance](https://finance.yahoo.com/)**，通过 Python 的 `yfinance` 库获取。

### 数据特点

- **覆盖范围**：29 种资产
- **时间跨度**：最多 15 年历史数据（部分资产从 2010 年开始）
- **更新频率**：建议每月更新一次
- **数据格式**：CSV（本地存储），JSON（Cloudflare KV）

---

## 🔄 更新方式

### 方式一：Python 脚本下载 + 上传到 KV（推荐）✅

这是最常用的方式，适合需要更新完整历史数据的情况。

#### 步骤 1：下载数据

```bash
cd scripts
python3 download_data.py
```

**说明**：
- 脚本会从 Yahoo Finance 下载所有 29 个资产的数据
- 数据保存到 `public/data/` 目录
- 每个资产生成单独的 CSV 文件（如 `BTC.csv`）
- 同时生成合并的 `all_assets.csv` 文件

**输出示例**：
```
📥 正在下载 BTC (BTC-USD) 的历史数据...
✅ BTC: 获取了 3756 条记录 (2014-09-17 ~ 2025-01-15)
...
✅ 数据下载完成！共下载了 29 个资产的数据
📁 CSV 文件位置: public/data
```

#### 步骤 2：上传到 Cloudflare KV

```bash
cd ..
node scripts/upload_csv_to_kv.cjs
```

**说明**：
- 脚本读取 `public/data/all_assets.csv`
- 解析并转换为 JSON 格式
- 上传到 Cloudflare KV 的 `historical_data` 键
- 验证上传成功

**输出示例**：
```
✅ CSV 解析成功: 5078 条记录
📦 数据大小: 3.2 MB
📤 正在上传数据到 KV...
✅ 上传成功！
   5078 条历史记录已上传到 Cloudflare KV
```

**优势**：
- ✅ 完整的数据更新
- ✅ 可以离线处理
- ✅ 绕过 API 限流问题
- ✅ 支持批量更新

**注意事项**：
- Yahoo Finance API 可能限流，建议间隔 1 小时以上再调用
- 如果下载失败，可以多次重试
- 确保网络连接稳定

---

### 方式二：直接上传本地 CSV（快速）

如果本地已有最新的 CSV 文件，可以直接上传。

```bash
# 确保 public/data/all_assets.csv 存在且是最新的
node scripts/upload_csv_to_kv.cjs
```

**使用场景**：
- 已经有最新的 CSV 文件
- 需要快速更新 KV 数据
- 避免重新下载数据

---

### 方式三：后台管理页面更新

通过 Web 界面更新数据，适合不熟悉命令行的用户。

#### 访问后台

1. **打开后台管理页面**
   ```
   https://www.soniclab.cc/dca-simulator/admin.html
   ```

2. **登录**
   - API 地址：`https://dca-simulator-api.sonic980828.workers.dev`
   - 管理员密码：`sonic666`

3. **切换到"数据管理"标签页**

4. **更新历史数据**
   - 在 "更新历史数据" 卡片中
   - 选择时间范围：
     - **最近 1 年**：快速更新，约 10 秒
     - **最近 5 年**：推荐选项，约 20-30 秒
     - **最大历史**：完整数据，约 1-2 分钟
   - 点击 **"立即更新"** 按钮
   - 等待完成

5. **验证成功**
   - 看到绿色提示："✅ Success! Updated data for 29 assets over Xy"
   - 刷新前端页面，确认数据已更新

**优势**：
- ✅ 图形界面，操作简单
- ✅ 可以选择时间范围
- ✅ 实时反馈更新进度

**注意事项**：
- ⚠️ 依赖 Yahoo Finance API，可能遇到限流
- ⚠️ 建议选择 "最近 5 年" 以平衡速度和完整性
- ⚠️ 网络不稳定时可能失败，需要重试

---

## 📁 数据格式说明

### CSV 格式

`public/data/all_assets.csv` 文件格式：

```csv
date,BTC,ETH,SP500,NASDAQ,AAPL,MSFT,...
2010-11-30,100.5,2.3,1180.5,2500.2,25.3,28.1,...
2010-12-01,101.2,2.31,1185.2,2510.5,25.4,28.2,...
...
```

**字段说明**：
- `date`: 日期（YYYY-MM-DD 格式）
- 其他列：各资产的收盘价（数值）

### JSON 格式（KV 存储）

KV 中存储的 JSON 格式：

```json
[
  {
    "date": "2010-11-30",
    "BTC": 100.5,
    "ETH": 2.3,
    "SP500": 1180.5,
    ...
  },
  ...
]
```

---

## 🔄 自动化更新

系统已配置 **每月 1 号自动更新数据**（通过 Cloudflare Worker Cron）。

### Cron 配置

配置文件：`worker/wrangler.toml`

```toml
[triggers]
crons = ["0 0 1 * *"]  # UTC 时间，每月1号 00:00
```

### 自动更新逻辑

Worker 会在每月 1 号执行以下操作：

1. 从 Yahoo Finance 获取最新数据
2. 更新 KV 中的 `historical_data`
3. 记录更新日志

### 验证自动更新

- 查看 Worker 日志（Cloudflare Dashboard）
- 检查 KV 中数据的最后更新时间
- 前端应自动使用最新数据

---

## ❓ 常见问题

### Q1: Yahoo Finance API 返回 "Too Many Requests"

**原因**：请求过于频繁，触发 API 限流

**解决方案**：
1. **等待重试**：等待 1-2 小时后重试
2. **使用 CSV 上传**：如果本地有最新 CSV，直接使用方式二上传
3. **后台更新**：使用后台管理页面，选择较短的时间范围（如 1 年）

### Q2: 上传脚本提示 "CSV 文件不存在"

**原因**：`public/data/all_assets.csv` 文件不存在

**解决方案**：
1. 先运行 `python3 scripts/download_data.py` 下载数据
2. 确认文件路径正确
3. 检查文件权限

### Q3: 上传后前端仍显示旧数据

**原因**：可能有缓存或数据未正确上传

**解决方案**：
1. **验证上传**：
   ```bash
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq 'length'
   ```
   应该返回记录数量（如 5078），而不是 0

2. **清除浏览器缓存**：强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

3. **检查 KV 数据**：在 Cloudflare Dashboard 中查看 KV 内容

### Q4: 数据更新需要多久？

**时间估算**：
- **Python 脚本下载**：5-10 分钟（取决于网络和资产数量）
- **上传到 KV**：10-30 秒（取决于数据大小）
- **后台更新（5年）**：20-30 秒
- **后台更新（完整）**：1-2 分钟

### Q5: CSV 数据还有用吗？

**有用！** CSV 数据作为**应急兜底**：

- 当 Worker API 失败时，前端会自动回退到 CSV 数据
- 确保在 API 不可用时仍能正常工作
- CSV 文件位于 `public/data/all_assets.csv`

### Q6: 如何验证数据是否正确？

**验证方法**：

1. **检查数据量**：
   ```bash
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq 'length'
   ```
   应该返回合理的数字（如 5000+）

2. **检查日期范围**：
   ```bash
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq '.[0].date, .[-1].date'
   ```
   应该显示数据的最早和最晚日期

3. **前端验证**：
   - 打开前端页面
   - 选择资产进行回测
   - 检查图表和数据是否正常显示

---

## 📊 资产代码映射

| 资产类别 | 应用代码 | Yahoo Finance 代码 | 说明 |
|---------|---------|-------------------|------|
| **加密货币** ||||
| 比特币 | BTC | BTC-USD | |
| 以太坊 | ETH | ETH-USD | |
| Solana | SOL | SOL-USD | |
| 币安币 | BNB | BNB-USD | |
| 瑞波币 | XRP | XRP-USD | |
| 艾达币 | ADA | ADA-USD | |
| 狗狗币 | DOGE | DOGE-USD | |
| **全球指数** ||||
| 标普500 | SP500 | ^GSPC | |
| 纳斯达克 | NASDAQ | ^IXIC | |
| 沪深300 | CSI300 | 510300.SS | ETF |
| 恒生指数 | HSI | ^HSI | |
| 日经225 | NIKKEI | ^N225 | |
| **美股科技** ||||
| 苹果 | AAPL | AAPL | |
| 微软 | MSFT | MSFT | |
| 谷歌 | GOOGL | GOOGL | |
| 亚马逊 | AMZN | AMZN | |
| Meta | META | META | |
| 英伟达 | NVDA | NVDA | |
| 特斯拉 | TSLA | TSLA | |
| Netflix | NFLX | NFLX | |
| AMD | AMD | AMD | |
| 英特尔 | INTC | INTC | |
| Visa | V | V | |
| 强生 | JNJ | JNJ | |
| 辉瑞 | PFE | PFE | |
| 宝洁 | PG | PG | |
| **商品/避险** ||||
| 黄金 | GOLD | GC=F | 期货 |
| 白银 | SILVER | SI=F | 期货 |
| 原油 | OIL | CL=F | 期货 |

完整映射定义在 `scripts/download_data.py` 的 `ASSET_TICKERS` 字典中。

---

## 🔍 数据质量检查

更新数据后，建议进行以下检查：

1. **数据完整性**
   - 确认所有 29 个资产都有数据
   - 检查是否有缺失日期

2. **数据时效性**
   - 确认最新日期接近当前日期
   - 检查是否有明显的数据滞后

3. **数据合理性**
   - 检查价格数据是否在合理范围内
   - 注意异常值（可能表示数据错误）

---

## 📝 更新记录

建议在更新数据后记录：

- 更新日期
- 更新方式
- 数据记录数
- 日期范围
- 遇到的问题（如有）

---

## 🔗 相关文档

- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署文档
- [MAINTENANCE.md](MAINTENANCE.md) - 维护指南
- [README.md](README.md) - 项目概览

---

**最后更新**：2025年1月

