const http = require('http');
const fs = require('fs');
const path = require('path');

// Pterodactyl utilise SERVER_PORT ; sinon PORT ou 3000
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.SERVER_PORT || process.env.PORT) || 3000;
const STATS_PATH = path.join(__dirname, 'api', 'stats.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function readStats() {
  return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
}

function writeStats(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    if (url.pathname === '/api/stats' && req.method === 'GET') {
      sendJson(res, 200, readStats());
      return;
    }

    if (url.pathname === '/api/stats/sync' && req.method === 'POST') {
      const body = await parseBody(req);
      const stats = readStats();

      if (body.guilds != null) stats.live.guilds = Math.max(0, Number(body.guilds) || 0);
      if (body.users != null) stats.live.users = Math.max(0, Number(body.users) || 0);
      if (body.commands != null) stats.totals.commands = Math.max(0, Number(body.commands) || 0);

      writeStats(stats);
      console.log(`[sync] ${stats.live.guilds} serveurs · ${stats.live.users} utilisateurs`);
      sendJson(res, 200, {
        success: true,
        live: stats.live,
        totals: stats.totals,
        updatedAt: stats.updatedAt,
      });
      return;
    }

    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
      return;
    }

    sendJson(res, 404, { success: false, error: 'Not found' });
  } catch (err) {
    sendJson(res, 500, { success: false, error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Site + API : http://127.0.0.1:${PORT}`);
  console.log('  POST /api/stats/sync  ← bot Python');
});
