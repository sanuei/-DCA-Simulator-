# 🔧 维护指南

本文档专注于系统监控和故障排查。关于数据更新和部署的详细说明，请参考：

- **[DATA_UPDATE.md](DATA_UPDATE.md)** - 数据更新详细指南
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 部署操作手册
- **[README.md](README.md)** - 项目概览

---

## 📊 监控检查

### API 状态检查

定期检查 API 是否正常运行：

```bash
# 检查资产配置
curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/config" | jq 'length'
# 应返回 29（29个资产）

# 检查历史数据
curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq 'length'
# 应返回数字（如 5078），而不是 0
```

### 前端状态检查

1. **访问前端页面**
   - 主站：`https://www.soniclab.cc/dca-simulator/`
   - GitHub Pages：`https://sanuei.github.io/-DCA-Simulator-/`

2. **检查浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 是否有错误
   - 查看 Network 标签，确认 API 请求成功

3. **验证数据加载**
   - 控制台应显示：`✅ API 数据加载成功: XXXX 条记录`
   - 不应出现黄色警告横幅（表示未使用 CSV 兜底）

### Worker 日志检查

1. **登录 Cloudflare Dashboard**
   - 进入 Workers & Pages > dca-simulator-api

2. **查看实时日志**
   - 点击 "Logs" 标签页
   - 查看是否有错误或异常

3. **检查 Cron 执行**
   - 查看每月1号的自动更新任务是否成功执行

---

## 🔍 故障排查

### 问题 1：前端显示"API 返回空数据"

**症状**：
- 页面显示黄色警告横幅
- 控制台显示使用 CSV 兜底数据

**排查步骤**：

1. **检查 API 是否可访问**
   ```bash
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data"
   ```

2. **检查 KV 数据是否存在**
   - 登录 Cloudflare Dashboard
   - 进入 Workers & Pages > KV
   - 查找键 `historical_data`，确认有数据

3. **如果 KV 数据为空，上传数据**
   ```bash
   node scripts/upload_csv_to_kv.cjs
   ```
   详细步骤参考 [DATA_UPDATE.md](DATA_UPDATE.md)

### 问题 2：Yahoo Finance API 限流

**症状**：
- 后台更新数据失败
- 返回 "Too Many Requests" 错误

**解决方案**：
1. **等待后重试**：等待 1-2 小时后重试
2. **使用 CSV 上传**：如果本地有最新 CSV，直接上传到 KV
3. **使用较短时间范围**：后台更新时选择"最近 1 年"而不是"最大历史"

详细说明参考 [DATA_UPDATE.md](DATA_UPDATE.md)

### 问题 3：前端资源 404

**症状**：页面加载但 JS/CSS 文件 404

**排查步骤**：
1. 检查 `vite.config.ts` 中的 `base` 配置是否正确（应为 `/dca-simulator/`）
2. 验证构建输出路径是否正确
3. 重新构建并部署

详细步骤参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### 问题 4：Worker 部署失败

**症状**：`wrangler deploy` 报错

**常见错误及解决**：

- **"Namespace not found"**
  - 解决：确认 KV 命名空间 ID 正确

- **"Authentication error"**
  - 解决：运行 `npx wrangler login` 重新登录

- **"Route conflict"**
  - 解决：检查 `wrangler.toml` 中的路由配置

详细说明参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### 问题 5：数据更新失败

**症状**：更新数据后前端仍显示旧数据

**排查步骤**：

1. **验证数据是否上传成功**
   ```bash
   curl "https://dca-simulator-api.sonic980828.workers.dev/api/assets/data" | jq 'length'
   ```

2. **清除浏览器缓存**
   - 强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
   - 或在开发者工具中禁用缓存

3. **检查 KV 数据时间戳**
   - 在 Cloudflare Dashboard 中查看 KV 数据的最后更新时间

详细步骤参考 [DATA_UPDATE.md](DATA_UPDATE.md)

---

## 🔐 配置文件

### KV 命名空间

所有数据存储在同一个 KV 命名空间：
- **ID**: `9ad5213e8f2c4203b0386cbf8f269271`
- **用途**: 用户、激活码、资产配置、历史数据

### 关键的 KV 键

- `assets_config`: 资产配置（29 个资产）
- `historical_data`: 历史价格数据（约 5000+ 条记录）
- `user:{deviceId}`: 用户数据
- `code:{code}`: 激活码数据

### Worker 环境变量

在 `worker/wrangler.toml` 中配置：

```toml
[vars]
ADMIN_PASSWORD = "sonic666"
JWT_SECRET = "Pt9y8yi0Ez+SHbDUfvvOK1DKylwErhD6UFo76Xmmnas="
```

**注意**：敏感信息应使用 `wrangler secret put` 设置，而不是直接写在配置文件中。

---

## 🚨 紧急联系

如遇到严重问题：

1. **查看日志**：Cloudflare Dashboard > Workers & Pages > Logs
2. **检查 KV 数据**：确认关键数据是否存在
3. **验证 API**：使用 curl 命令测试 API 端点
4. **查看文档**：参考 [DATA_UPDATE.md](DATA_UPDATE.md) 和 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📝 定期维护任务

### 每月任务

- ✅ 验证自动数据更新是否成功执行（每月1号）
- ✅ 检查 API 状态和响应时间
- ✅ 查看 Worker 日志，确认无异常错误

### 每季度任务

- ✅ 检查 KV 存储使用量
- ✅ 更新依赖包（如需要）
- ✅ 审查 Worker 日志，识别潜在问题

### 年度任务

- ✅ 审查和更新文档
- ✅ 检查 SSL 证书有效期
- ✅ 评估系统性能和优化机会

---

## 🔗 相关文档

- [DATA_UPDATE.md](DATA_UPDATE.md) - 数据更新详细指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署操作手册
- [README.md](README.md) - 项目概览和使用说明

---

**最后更新**：2025年1月
