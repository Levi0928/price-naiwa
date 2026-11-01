# 奶蛙小游戏合集（price-naiwa）

自研前端小游戏门户：狂笑点按、合成、2048、消消乐、贪吃蛙、跳一跳。视觉为原创「招财金蛙」SVG/Canvas，不包含第三方站点素材。

## 本地

```bash
node server.js
# http://localhost:8080/
```

## Render 新建（推荐服务名 `price-naiwa`）

本仓库无 Render API Key，需在控制台手动建服务：

1. 打开 https://dashboard.render.com/ → **New** → **Web Service**
2. 连接 GitHub 仓库 `Levi0928/price-naiwa`（或 Blueprint 用本目录 `render.yaml`）
3. 设置：
   - **Name**: `price-naiwa`
   - **Region**: Singapore
   - **Runtime**: Node
   - **Build Command**: `true`（无依赖）
   - **Start Command**: `npm start` 或 `node server.js`
   - **Plan**: Free
   - **Health Check Path**: `/healthz`
4. 部署完成后公网地址形如：`https://price-naiwa.onrender.com/`
5. 可选：Settings → Custom Domain 绑定自己的域名

也可 **New** → **Blueprint**，选本仓库，自动读 `render.yaml`。

## 路径

- `/` 合集首页
- `/laugh/` `/merge/` `/g2048/` `/match3/` `/snake/` `/jump/`
- `/author.html` 作者占位页
- `/naiwa/*`、`/price-naiwa/*` 会 302 到根路径（兼容旧链接）
