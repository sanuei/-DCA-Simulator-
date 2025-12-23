# 🚀 部署文档

本文档详细说明如何部署 DCA Simulator 的前端和 Worker 后端。

---

## 📋 前置要求

- **Cloudflare 账户**（免费账户即可）
- **Wrangler CLI** 已安装（`npm install -g wrangler` 或使用 `npx wrangler`）
- **Node.js 16+**
- **Cloudflare KV 命名空间**已创建（ID: `9ad5213e8f2c4203b0386cbf8f269271`）

---

## 🎨 前端部署（Cloudflare Pages）

### 方式一：使用 npm script（推荐）

```bash
# 构建并部署
npm run deploy
```

这个命令会：
1. 运行 `npm run build` 构建项目
2. 使用 `wrangler pages deploy` 部署到 Cloudflare Pages

### 方式二：手动部署

```bash
# 1. 构建项目
npm run build

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name dca-simulator
```

### 配置说明

#### Vite 配置

前端配置位于 `vite.config.ts`：

```typescript
{
  base: '/dca-simulator/',  // 子路径配置
  build: {
    outDir: 'dist/dca-simulator',
    emptyOutDir: true
  },
  server: {
    port: 3000,  // 开发服务器端口
    host: '0.0.0.0'
  }
}
```

**重要**：`base` 路径必须与部署路径一致（`/dca-simulator/`）。

#### 环境变量

前端可配置的环境变量：

- `VITE_API_URL`: API 地址（默认为 `https://dca-simulator-api.sonic980828.workers.dev`）

在 Cloudflare Pages 中设置环境变量：
1. 进入 Pages 项目设置
2. 导航到 "Environment variables"
3. 添加变量（如果需要）

---

## ⚙️ Worker 部署（Cloudflare Workers）

### 部署步骤

```bash
# 1. 进入 worker 目录
cd worker

# 2. 安装依赖（首次部署需要）
npm install

# 3. 部署 Worker
npx wrangler deploy
```

### Worker 配置

配置文件：`worker/wrangler.toml`

```toml
name = "dca-simulator-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
workers_dev = true

routes = [
  { pattern = "dca.soniclab.cc/*", zone_name = "soniclab.cc" }
]

[[kv_namespaces]]
binding = "DCA_USERS"
id = "9ad5213e8f2c4203b0386cbf8f269271"

# ... 其他 KV 命名空间配置

[vars]
ADMIN_PASSWORD = "sonic666"
JWT_SECRET = "Pt9y8yi0Ez+SHbDUfvvOK1DKylwErhD6UFo76Xmmnas="

[triggers]
crons = ["0 0 1 * *"]  # 每月1号自动更新数据
```

### 关键配置说明

#### KV 命名空间

所有 KV 命名空间共享同一个 ID：
- `DCA_USERS`: 用户数据
- `DCA_CODES`: 激活码
- `DCA_SESSIONS`: 会话数据
- `DCA_REFERRALS`: 推荐关系
- `DCA_DATA`: 历史数据和资产配置

#### 环境变量（Secrets）

需要在 Cloudflare Dashboard 或使用命令行设置：

```bash
# 设置管理员密码
npx wrangler secret put ADMIN_PASSWORD

# 设置 JWT 密钥
npx wrangler secret put JWT_SECRET
```

或者直接在 `wrangler.toml` 的 `[vars]` 部分配置（不推荐用于敏感信息）。

#### Cron 触发器

配置了每月1号自动更新数据的 Cron 任务：

```toml
[triggers]
crons = ["0 0 1 * *"]  # UTC 时间，每月1号 00:00
```

### 首次部署准备

1. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **验证 KV 命名空间**
   确保 KV 命名空间 ID `9ad5213e8f2c4203b0386cbf8f269271` 已创建并可用。

3. **配置路由（可选）**
   如果使用自定义域名，在 `wrangler.toml` 中配置 `routes`。

---

## ✅ 部署验证

### 验证前端部署

1. **检查页面可访问性**
   - 访问：`https://www.soniclab.cc/dca-simulator/`
   - 或：`https://dca-simulator.pages.dev/`

2. **检查控制台错误**
   - 打开浏览器开发者工具
   - 查看 Console 是否有错误
   - 确认数据加载正常

3. **检查 API 连接**
   - 查看 Network 标签
   - 确认 `/api/assets/config` 和 `/api/assets/data` 请求成功

### 验证 Worker 部署

1. **测试 API 端点**
   ```bash
   # 测试资产配置
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/config"
   # 应该返回 JSON 数组，包含29个资产

   # 测试历史数据
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq 'length'
   # 应该返回数字（如 5078），而不是 0
   ```

2. **检查 Worker 日志**
   - 登录 Cloudflare Dashboard
   - 进入 Workers & Pages > dca-simulator-api
   - 查看 "Logs" 标签页

3. **验证 KV 数据**
   确保 KV 中有以下关键数据：
   - `assets_config`: 资产配置（29个资产）
   - `historical_data`: 历史价格数据

---

## 🔧 常见部署问题

### 问题 1：前端资源 404

**症状**：页面加载但 JS/CSS 文件 404

**原因**：`base` 路径配置错误

**解决**：
1. 检查 `vite.config.ts` 中的 `base` 配置
2. 确保构建输出路径正确
3. 重新构建并部署

### 问题 2：API 请求失败

**症状**：前端显示"API 返回空数据"

**原因**：
- Worker 未正确部署
- API URL 配置错误
- KV 数据未初始化

**解决**：
1. 验证 Worker 是否正常运行
2. 检查 `VITE_API_URL` 环境变量
3. 运行数据上传脚本（参考 [DATA_UPDATE.md](DATA_UPDATE.md)）

### 问题 3：Worker 部署失败

**症状**：`wrangler deploy` 报错

**常见错误**：

- **"Namespace not found"**
  - 解决：确认 KV 命名空间 ID 正确，或先创建命名空间

- **"Authentication error"**
  - 解决：运行 `npx wrangler login` 重新登录

- **"Route conflict"**
  - 解决：检查 `wrangler.toml` 中的 `routes` 配置，确保不与其他 Worker 冲突

### 问题 4：Cron 任务不执行

**症状**：每月自动更新数据未触发

**原因**：Cron 触发器配置错误或未启用

**解决**：
1. 检查 `wrangler.toml` 中的 `[triggers]` 配置
2. 在 Cloudflare Dashboard 中验证 Cron 触发器状态
3. 手动触发测试（通过后台管理页面）

---

## 📊 部署架构

```
用户请求
    ↓
Cloudflare CDN
    ↓
前端 (Cloudflare Pages)
    ├── /dca-simulator/         → 静态文件
    └── API 请求 → Worker
         ↓
Worker (Cloudflare Workers)
    ├── /api/assets/config      → 资产配置
    ├── /api/assets/data        → 历史数据
    ├── /api/admin/*            → 管理接口
    └── KV Storage
         ├── assets_config
         ├── historical_data
         └── user data...
```

---

## 🔄 更新部署

### 前端更新

```bash
# 修改代码后
npm run build
npm run deploy
```

### Worker 更新

```bash
cd worker
# 修改代码后
npx wrangler deploy
```

### 回滚部署

Cloudflare Pages 和 Workers 都支持版本管理：

- **Pages**：在 Dashboard 中查看部署历史，可以快速回滚到之前的版本
- **Workers**：使用 `wrangler rollback` 命令或通过 Dashboard 操作

---

## 📝 相关文档

- [DATA_UPDATE.md](DATA_UPDATE.md) - 数据更新指南
- [MAINTENANCE.md](MAINTENANCE.md) - 维护和监控
- [README.md](README.md) - 项目概览

---

## 💡 最佳实践

1. **环境分离**：建议创建 staging 环境用于测试
2. **自动化部署**：考虑使用 GitHub Actions 自动部署
3. **监控告警**：配置 Cloudflare 告警，及时发现问题
4. **备份数据**：定期备份 KV 中的重要数据
5. **版本管理**：使用 Git 标签管理发布版本

---

**最后更新**：2025年1月

