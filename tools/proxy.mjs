// 本地开发代理 —— 解决 CORS 问题
// 用法: node tools/proxy.mjs （与 next dev 同时运行）
// StageFlight 在 dev 时会自动调这个代理

import http from 'node:http';
import https from 'node:https';

const PORT = 3001;
const COZE_HOST = 'ws7jqgs82z.coze.site';
const COZE_TOKEN = process.env.COZE_TOKEN;
if (!COZE_TOKEN) {
  console.error('❌ COZE_TOKEN not set. Create .env.local and run: node --env-file=.env.local tools/proxy.mjs');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/run') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: COZE_HOST,
        path: '/run',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const proxyReq = https.request(options, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode || 200, {
            'Content-Type': 'application/json',
          });
          res.end(data);
        });
      });

      proxyReq.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.end(body);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Dev proxy running on http://localhost:${PORT}/api/run`);
});
