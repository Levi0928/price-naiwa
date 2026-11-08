#!/usr/bin/env node
'use strict';
/* 奶蛙小游戏合集 — 独立轻量静态站 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const PUB = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.wav': 'audio/wav',
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': code === 200 ? 'public, max-age=60' : 'no-cache',
  });
  res.end(body);
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  return full;
}

function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // directory index
      if (!err && st.isDirectory()) {
        return serveFile(req, res, path.join(file, 'index.html'));
      }
      return send(res, 404, '找不到页面');
    }
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    fs.readFile(file, (e2, buf) => {
      if (e2) return send(res, 500, '读取失败');
      send(res, 200, buf, type);
    });
  });
}

const server = http.createServer((req, res) => {
  let u;
  try { u = new URL(String(req.url || '/').replace(/^\/{2,}/, '/'), 'http://localhost'); } catch (e) { return send(res, 400, '错误的请求'); }
  let p = u.pathname;

  if (p === '/healthz' || p === '/health') {
    return send(res, 200, 'ok', 'text/plain; charset=utf-8');
  }

  // old path aliases from hongzhong embed
  if (p === '/price-naiwa' || p === '/price-naiwa/' || p === '/naiwa' || p === '/naiwa/') {
    res.writeHead(302, { Location: '/' + (u.search || '') });
    return res.end();
  }
  if (p.startsWith('/price-naiwa/')) {
    res.writeHead(302, { Location: p.slice('/price-naiwa'.length) + (u.search || '') });
    return res.end();
  }
  if (p.startsWith('/naiwa/')) {
    res.writeHead(302, { Location: p.slice('/naiwa'.length) + (u.search || '') });
    return res.end();
  }

  if (p !== '/' && !path.extname(p) && !p.endsWith('/')) {
    // allow /laugh -> /laugh/
    const asDir = safeJoin(PUB, p);
    if (asDir && fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
      res.writeHead(302, { Location: p + '/' + (u.search || '') });
      return res.end();
    }
  }

  const file = safeJoin(PUB, p === '/' ? '/index.html' : p);
  if (!file) return send(res, 403, 'forbidden');
  return serveFile(req, res, file);
});

server.listen(PORT, HOST, () => {
  console.log(`price-naiwa listening on http://${HOST}:${PORT}`);
});
