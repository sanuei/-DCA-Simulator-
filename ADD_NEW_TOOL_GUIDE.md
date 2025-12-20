# 🚀 如何将新项目部署到 www.soniclab.cc 子路径

本文档介绍如何将一个新的独立项目（无论技术栈是 React, Vue, HTML 还是其他）集成到 `www.soniclab.cc/你的项目名` 下。

目前的架构使用 **Cloudflare Workers** 作为网关，根据 URL 路径将流量转发到不同的后端服务（通常是 Cloudflare Pages）。

---

## 🗺️ 架构原理

```text
用户访问 www.soniclab.cc/new-tool/
       ⬇️
Cloudflare Workers (网关)
       ⬇️ (匹配路径 /new-tool/*)
       ⬇️ 转发请求
新项目部署地址 (例如: new-tool.pages.dev)
```

## ✅ 步骤一：独立部署新项目

首先，你需要将你的新项目部署到一个可访问的 URL（推荐使用 Cloudflare Pages）。

1.  **开发你的新项目**：
    *   **关键点**：你的新项目在构建时，必须配置 `base path`（基础路径）。
    *   例如，如果你想部署到 `/my-tool`，那么你的 HTML 引用资源必须是 `<script src="/my-tool/assets/..." >`，而不是 `<script src="/assets/..." >`。
    *   **Vite 配置示例** (`vite.config.ts`):
        ```typescript
        export default defineConfig({
          base: '/my-tool/', // 👈 必须与你计划的子路径一致
          // ...
        });
        ```

2.  **SEO 优化建议 (可选但推荐)**：
    *   为了获得更好的搜索排名，建议为你的新工具实现**预渲染 (Prerendering)** 或 **静态站点生成 (SSG)**。
    *   参考 `kanasonic` 项目中的 `scripts/prerender-routes.js`，在构建后生成每个路由的静态 HTML（包含正确的 Title, Description, Canonical 等 Meta 标签）。
    *   如果无法做 SSG，请确保你的 `index.html` 包含通用的 Meta 信息。

3.  **部署到 Cloudflare Pages**：
    *   使用 `wrangler` 或 Cloudflare Dashboard 进行部署。
    *   假设部署后的域名是：`my-new-tool.pages.dev`。
    *   确保直接访问 `https://my-new-tool.pages.dev/my-tool/` (带子路径) 或 `https://my-new-tool.pages.dev/` 能正常工作。

---

## ✅ 步骤二：更新路由规则 (Worker)

修改本项目中的 `worker/src/index.ts` 文件，添加新项目的转发规则。

1.  打开 `kanasonic/worker/src/index.ts`。
2.  找到 `fetch` 方法中的路由判断逻辑。
3.  添加一段新的 `if` 逻辑，参考如下：

```typescript
// 🆕 新增：路由到 My New Tool
if (path.startsWith('/my-tool')) {
  // 1. 处理不带斜杠的根路径重定向 (可选)
  if (path === '/my-tool') {
    return Response.redirect(`${url.origin}/my-tool/`, 301);
  }

  // 2. 定义目标后端地址
  // 如果你的新项目部署在根目录，这里 targetUrl 就是 path
  // 建议复用 forwardToPages 函数（如果后端也是 Pages）
  const targetHost = 'https://my-new-tool.pages.dev';
  
  // 3. 构建目标 URL
  const targetUrl = new URL(path, targetHost);

  // 4. 创建转发请求 (注意处理 Headers)
  const headers = new Headers(request.headers);
  headers.delete('Host'); // 移除原 Host 头

  const newRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  });

  // 5. 执行转发
  return fetch(newRequest);
}
```

> **注意**：为了保持代码整洁，建议复用现有的 `forwardToPages` 函数。你可以修改它以支持传入 `targetHost` 参数。

---

## ✅ 步骤三：更新首页列表

修改 `worker/src/index.ts` 中根路径 `/` 的 HTML 返回内容，在列表中添加你的新工具。

```typescript
// 根路径：显示工具列表
if (path === '/') {
  return new Response(`
    <!DOCTYPE html>
    ...
      <div class="tool">
        <h2><a href="/kanasonic/jp">Kanasonic</a></h2>
        <p>日语转换工具</p>
      </div>
      <!-- 🆕 新增工具 -->
      <div class="tool">
        <h2><a href="/my-tool/">My New Tool</a></h2>
        <p>这是一个很棒的新工具</p>
      </div>
    ...
  `);
}
```

---

## ✅ 步骤四：更新 Sitemap (可选)

为了让 Google 更快发现你的新工具：

1.  修改 `public/sitemap.xml`，添加新工具的 URL。
2.  或者，如果新工具自己有 sitemap，可以在 `worker/src/index.ts` 中针对 `/sitemap.xml` 做合并处理（较复杂），或者在 robots.txt 中添加新工具的 sitemap 地址。

---

## ✅ 步骤五：部署更新

在 `kanasonic` 项目根目录下运行：

```bash
# 仅更新 Workers 路由
npm run deploy:worker
```

部署完成后，访问 `https://www.soniclab.cc/my-tool/` 即可看到你的新项目。

---

## 💡 常见问题 (FAQ)

### Q1: 新项目的资源 (JS/CSS) 404 了怎么办？
**原因**：通常是因为新项目构建时的 `base` 路径没设置对。
**解决**：
1. 确保新项目的构建配置（如 `vite.config.ts`）中设置了 `base: '/你的子路径/'`。
2. 确保 Worker 转发时，路径没有被错误截断。默认的转发逻辑是透传路径，所以如果用户请求 `/my-tool/style.css`，Worker 也会向后端请求 `/my-tool/style.css`。如果你的后端此时在根目录提供文件，就会 404。**后端的文件结构必须与 URL 结构匹配**。

### Q2: 为什么不直接把代码放到 kanasonic 仓库里？
虽然可以这样做（Monorepo），但独立的仓库和部署流程可以让不同的工具保持解耦。你可以用 Vue 写一个工具，用 React 写另一个，互不干扰，只需要通过 Worker 路由聚合在一起。

### Q3: 如何共享 soniclab.cc 的 Logo 或公共资源？
目前 `favicon.svg` 等资源由 `kanasonic` 项目的 `public` 目录提供，并通过 Worker 转发。如果新工具需要使用，可以直接引用 `/favicon.svg`。

### Q4: 根域名 soniclab.cc 和 www.soniclab.cc 怎么处理？
目前 Worker 配置了强制 301 重定向：所有访问 `soniclab.cc` 的请求都会跳转到 `www.soniclab.cc`。这有助于统一 SEO 权重和简化 GSC 验证。Worker 的路由配置位于 `worker/wrangler.toml` 的顶层 `routes` 字段。
