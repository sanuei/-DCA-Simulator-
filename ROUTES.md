# 路由配置检查文档

## Worker 路由配置

### 当前配置（worker/wrangler.toml）

```toml
name = "dca-simulator-api"
workers_dev = true

routes = [
  { pattern = "dca.soniclab.cc/*", zone_name = "soniclab.cc" }
]
```

### 路由说明

1. **自定义域名路由**：
   - 模式：`dca.soniclab.cc/*`
   - Zone：`soniclab.cc`
   - 状态：✅ 已配置
   - 说明：所有访问 `dca.soniclab.cc` 的请求都会被路由到这个 Worker

2. **Workers.dev 域名**：
   - URL：`https://dca-simulator-api.sonic980828.workers.dev`
   - 状态：✅ 自动启用（`workers_dev = true`）
   - 说明：这是 Worker 的默认预览/开发域名

3. **预览 URL**：
   - 模式：`*-dca-simulator-api.sonic980828.workers.dev`
   - 状态：✅ 自动生成
   - 说明：每次部署都会生成一个唯一的预览 URL

## 前端 API 配置

### 当前配置（App.tsx）

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://dca-simulator-api.sonic980828.workers.dev';
```

### API 端点

前端使用以下 API 端点：
- 资产配置：`${API_URL}/api/assets/config`
- 历史数据：`${API_URL}/api/assets/data`
- 用户登录：`${API_URL}/api/auth/login`
- 用户信息：`${API_URL}/api/user/me`
- 激活码兑换：`${API_URL}/api/code/redeem`
- 推荐系统：`${API_URL}/api/referral/create`

## 路由验证清单

### ✅ 已配置的路由

- [x] `dca.soniclab.cc/*` → Worker
- [x] `dca-simulator-api.sonic980828.workers.dev` → Worker
- [x] `*-dca-simulator-api.sonic980828.workers.dev` → Worker（预览）

### 🔍 需要验证的路由

1. **自定义域名是否生效**：
   ```bash
   curl https://dca.soniclab.cc/
   curl https://dca.soniclab.cc/api/assets/config
   ```

2. **Workers.dev 域名是否正常**：
   ```bash
   curl https://dca-simulator-api.sonic980828.workers.dev/
   curl https://dca-simulator-api.sonic980828.workers.dev/api/assets/config
   ```

3. **DNS 配置**：
   - 检查 `dca.soniclab.cc` 的 DNS 记录是否指向 Cloudflare
   - 确认 Cloudflare 中该域名的代理状态（橙色云朵）

## 路由问题排查

### 问题 1：自定义域名无法访问

**可能原因**：
- DNS 未正确配置
- Cloudflare Zone 未正确设置
- 路由配置错误

**解决方法**：
1. 检查 DNS 记录：`dca.soniclab.cc` 应该指向 Cloudflare（CNAME 或 A 记录）
2. 检查 Cloudflare Dashboard → Workers & Pages → Routes
3. 确认 `soniclab.cc` zone 已添加到 Cloudflare 账户

### 问题 2：Workers.dev 域名返回 404

**可能原因**：
- Worker 未正确部署
- 路由处理逻辑问题

**解决方法**：
1. 检查 Worker 部署状态：`npx wrangler deployments list`
2. 检查 Worker 代码中的路由处理
3. 查看 Worker 日志：`npx wrangler tail`

### 问题 3：前端无法连接 API

**可能原因**：
- API URL 配置错误
- CORS 问题
- 网络问题

**解决方法**：
1. 检查浏览器控制台的网络请求
2. 验证 API URL 是否正确
3. 检查 Worker 的 CORS 配置

## 当前部署状态

### Worker 部署
- **最新版本 ID**：`755e4439-8c6a-46fe-a0fa-9847b786b324`
- **部署时间**：2025-12-26
- **状态**：✅ 已部署

### 前端部署
- **最新部署 ID**：`cd1172b5`
- **部署 URL**：`https://cd1172b5.dca-simulator-86l.pages.dev`
- **生产 URL**：`https://www.soniclab.cc/dca-simulator/`
- **状态**：✅ 已部署

## 建议的改进

1. **统一 API 域名**：
   - 考虑使用自定义域名 `dca.soniclab.cc` 作为主要 API 域名
   - 更新前端配置使用自定义域名

2. **环境变量配置**：
   - 为不同环境（开发/生产）配置不同的 API URL
   - 使用 Cloudflare Pages 环境变量功能

3. **路由监控**：
   - 设置路由健康检查
   - 监控路由响应时间

## 快速测试命令

```bash
# 测试 Worker 根路径
curl https://dca-simulator-api.sonic980828.workers.dev/

# 测试 API 端点
curl https://dca-simulator-api.sonic980828.workers.dev/api/assets/config

# 测试自定义域名（如果已配置）
curl https://dca.soniclab.cc/
curl https://dca.soniclab.cc/api/assets/config
```

---

**最后更新**：2025-12-26

