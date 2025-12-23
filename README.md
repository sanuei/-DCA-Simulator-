# 定投回测模拟器 DCA Simulator

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-94%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff)](https://vitejs.dev/)

一个基于真实历史数据的定投策略回测工具，支持比特币、以太坊、美股指数、科技巨头股票等多种资产的投资模拟。

[在线演示](https://www.soniclab.cc/dca-simulator/) | [GitHub Pages](https://sanuei.github.io/-DCA-Simulator-/)

</div>

---

## 📖 项目简介

**定投回测模拟器**是一款专业的投资策略回测工具，帮助投资者通过历史数据模拟定期定额投资（Dollar Cost Averaging, DCA）策略的收益表现。

### 为什么选择 DCA 策略？

- 📉 **降低市场波动风险**：分散投资时间，避免一次性买在高点
- 💰 **无需择时**：无需判断市场高低点，定期投资即可
- 🎯 **纪律投资**：培养长期投资习惯，避免情绪化决策
- 📊 **历史验证**：通过真实历史数据验证策略有效性

---

## ✨ 功能特性

### 🌐 真实历史数据
- 使用 **Yahoo Finance** 真实历史价格数据
- 覆盖 **15年**历史数据（部分资产从2010年开始）
- 数据存储在 Cloudflare KV，每月自动更新
- 本地CSV作为应急兜底数据源

### 📈 支持资产类别
- **加密货币** (7种)：比特币(BTC)、以太坊(ETH)、Solana(SOL)、币安币(BNB)、瑞波币(XRP)、艾达币(ADA)、狗狗币(DOGE)
- **全球指数** (5种)：标普500、纳斯达克、沪深300、恒生指数、日经225
- **美股优质股** (14种)：苹果(AAPL)、微软(MSFT)、谷歌(GOOGL)、亚马逊(AMZN)、Meta(META)、英伟达(NVDA)、特斯拉(TSLA)、Netflix(NFLX)、AMD、英特尔(INTC)、Visa(V)、强生(JNJ)、辉瑞(PFE)、宝洁(PG)
- **商品避险** (3种)：黄金期货、白银期货、原油期货

**总计 29 种资产**，涵盖科技、消费、医疗、金融等多个行业，满足多元化投资需求。

### 🎛️ 灵活配置
- **投资金额**：自定义每期投资金额（USD）
- **投资频率**：支持每月/每周定投
- **回测时长**：1年/3年/5年/10年/15年可选
- **多资产对比**：同时对比多个资产的投资表现

### 📊 专业指标
- **总资产价值**：当前投资组合总价值
- **总投入成本**：累计投入本金
- **投资回报率(ROI)**：总收益百分比
- **年化收益率(CAGR)**：复合年均增长率
- **最大回撤**：历史最大跌幅

### 🎬 可视化动画
- **增长趋势图**：直观展示资产价值变化
- **动画播放**：逐步展示投资过程
- **实时对比**：多资产收益曲线对比
- **智能刻度**：根据时间范围自动调整坐标轴

### 📱 响应式设计
- 完美适配桌面端、平板、手机
- 移动端优化，无横向滚动
- 触控友好的交互体验

### 🌍 多语言支持
- 繁体中文
- 简体中文
- English

---

## 🚀 快速开始

### 前置要求
- Node.js 16+ 
- Python 3.7+ (用于数据下载)

### 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖
pip install yfinance pandas
```

### 下载历史数据

```bash
# 运行数据下载脚本
python3 scripts/download_data.py
```

数据将保存到 `public/data/` 目录，包括：
- 各资产单独的 CSV 文件（如 `BTC.csv`）
- 合并的 `all_assets.csv` 文件

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可查看应用（端口在 `vite.config.ts` 中配置为3000）。

### 构建生产版本

```bash
npm run build
npm run preview
```

---

## 📂 项目结构

```
-DCA-Simulator-/
├── scripts/
│   ├── download_data.py       # 数据下载脚本（从Yahoo Finance）
│   └── upload_csv_to_kv.cjs   # CSV数据上传到Cloudflare KV脚本
├── worker/                    # Cloudflare Worker后端
│   ├── src/
│   │   ├── index.ts          # Worker主入口
│   │   ├── middleware.ts     # 中间件
│   │   └── utils.ts          # 工具函数
│   └── wrangler.toml         # Worker配置
├── src/                       # 前端源代码
│   ├── components/
│   │   └── AuthModal.tsx     # 认证模态框
│   ├── services/
│   │   └── api.ts            # API服务
│   ├── store/
│   │   └── userStore.ts      # 用户状态管理
│   └── utils/
│       └── translations.ts   # 多语言翻译
├── utils/
│   ├── dataLoader.ts          # CSV 数据加载工具
│   └── finance.ts             # DCA 计算逻辑
├── public/
│   ├── data/                  # 历史价格数据（CSV 格式，作为兜底）
│   ├── admin.html             # 后台管理页面
│   ├── robots.txt             # SEO配置
│   └── sitemap.xml            # 站点地图
├── archive/                   # 归档文档
├── App.tsx                    # 主应用组件
├── types.ts                   # TypeScript 类型定义
└── index.html                 # HTML 入口文件
```

---

## 🔧 技术栈

- **前端框架**：React 19.2 + TypeScript
- **构建工具**：Vite 6.4
- **图表库**：Recharts 3.5
- **UI 样式**：Tailwind CSS
- **图标库**：Lucide React
- **数据源**：Yahoo Finance (via yfinance)

---

## 📊 数据来源

所有历史价格数据来自 [Yahoo Finance](https://finance.yahoo.com/)，通过 Python 的 `yfinance` 库获取。

### 数据代码映射

| 资产 | Yahoo Finance 代码 | 数据起始日期 |
|------|-------------------|------------|
| **加密货币** |||
| 比特币 | BTC-USD | 2014-09-17 |
| 以太坊 | ETH-USD | 2017-11-09 |
| Solana | SOL-USD | ~2020 |
| 币安币 | BNB-USD | ~2017 |
| 瑞波币 | XRP-USD | ~2017 |
| 艾达币 | ADA-USD | ~2017 |
| 狗狗币 | DOGE-USD | 2017-11-09 |
| **全球指数** |||
| 标普500 | ^GSPC | 2010-11-30 |
| 纳斯达克 | ^IXIC | 2010-11-30 |
| 沪深300 | 510300.SS | 2012-05-04 |
| 恒生指数 | ^HSI | 2010-11-30 |
| 日经225 | ^N225 | 2010-11-30 |
| **美股科技巨头** |||
| 苹果 | AAPL | 2010-11-30 |
| 微软 | MSFT | 2010-11-30 |
| 谷歌 | GOOGL | 2010-11-30 |
| 亚马逊 | AMZN | 2010-11-30 |
| Meta | META | 2012-05-18 |
| 英伟达 | NVDA | 2010-11-30 |
| 特斯拉 | TSLA | 2010-11-30 |
| Netflix | NFLX | 2010-11-30 |
| AMD | AMD | 2010-11-30 |
| 英特尔 | INTC | 2010-11-30 |
| Visa | V | 2010-11-30 |
| 强生 | JNJ | 2010-11-30 |
| 辉瑞 | PFE | 2010-11-30 |
| 宝洁 | PG | 2010-11-30 |
| **商品/避险** |||
| 黄金 | GC=F | 2010-11-30 |
| 白银 | SI=F | 2010-11-30 |
| 原油 | CL=F | 2010-11-30 |

### 更新数据

数据会随时间变化，建议定期更新。详细的数据更新指南请参考 [DATA_UPDATE.md](DATA_UPDATE.md)。

**快速更新方式：**

1. **使用上传脚本（推荐）**
   ```bash
   python3 scripts/download_data.py          # 下载最新数据
   node scripts/upload_csv_to_kv.cjs         # 上传到Cloudflare KV
   ```

2. **通过后台管理页面**
   访问 `https://www.soniclab.cc/dca-simulator/admin.html`，在"数据管理"标签页更新数据。

3. **自动化更新**
   系统已配置每月1号自动更新（通过Cloudflare Worker Cron）。

---

## 📝 使用说明

1. **选择资产**：在"选择对比资产"区域勾选想要对比的资产
2. **设置参数**：配置投资金额、频率和回测时长
3. **查看结果**：页面会自动计算并展示投资表现
4. **播放动画**：点击"播放动画"按钮查看投资过程演示
5. **导出数据**：可通过浏览器开发者工具导出图表数据

---

## 🚀 部署说明

本项目使用 **Cloudflare Pages** 部署前端，**Cloudflare Workers** 提供后端API服务。

详细的部署步骤请参考 [DEPLOYMENT.md](DEPLOYMENT.md)。

**快速部署：**

```bash
# 部署前端
npm run build
npm run deploy

# 部署Worker
cd worker
npx wrangler deploy
```

---

## 🔧 维护说明

项目维护相关信息请参考：

- **[MAINTENANCE.md](MAINTENANCE.md)** - 监控和故障排查
- **[DATA_UPDATE.md](DATA_UPDATE.md)** - 数据更新详细指南
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 部署操作手册

---

## ⚠️ 免责声明

**本工具仅供教育和研究目的使用，不构成任何投资建议。**

- 历史数据不代表未来表现
- 实际投资涉及交易费用、税收等成本
- 请根据自身风险承受能力做出投资决策
- 投资有风险，入市需谨慎

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

---

## 👤 作者

**@sonic_yann**

- GitHub: [@sanuei](https://github.com/sanuei)
- Twitter/X: [@sonic_yann](https://x.com/sonic_yann)

---

## 🌟 Star History

如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！

---

<div align="center">

**[⬆ 回到顶部](#定投回测模拟器-dca-simulator)**

Made with ❤️ by [@sonic_yann](https://x.com/sonic_yann)

</div>
