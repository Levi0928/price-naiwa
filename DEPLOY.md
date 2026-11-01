# 在 Render 上新建 price-naiwa（独立站）

目标公网：`https://price-naiwa.onrender.com/`  
仓库：https://github.com/Levi0928/price-naiwa  

本机没有 Render API Key，需在控制台点几下（约 2 分钟）：

## 方式 A：Blueprint（推荐）

1. 打开 https://dashboard.render.com/
2. **New** → **Blueprint**
3. 连接 GitHub 仓库 `Levi0928/price-naiwa`
4. 确认读到 `render.yaml`（服务名 `price-naiwa`，Singapore，Free）
5. **Apply** 等待部署

## 方式 B：手动 Web Service

1. **New** → **Web Service** → 选 `Levi0928/price-naiwa`
2. 填写：
   - Name: `price-naiwa`
   - Region: `Singapore`
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `true`
   - Start Command: `npm start`
   - Instance type: Free
3. Advanced → Health Check Path: `/healthz`
4. **Create Web Service**

## 自定义域名（可选）

Settings → Custom Domains → 添加你的域名，按提示加 CNAME。

## 验证

```bash
curl -sI https://price-naiwa.onrender.com/healthz   # 200 ok
curl -sI https://price-naiwa.onrender.com/assets/frog.svg
open https://price-naiwa.onrender.com/
```

大厅 `hongzhong.onrender.com` 卡片已指向本站；旧路径 `/naiwa`、`/price-naiwa` 会 302 过来。
