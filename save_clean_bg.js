import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        const base64Data = json.data.replace(/^data:image\/jpeg;base64,/, '');
        const targetPath = path.join(__dirname, 'assets', 'experience-bg.jpg');
        fs.writeFileSync(targetPath, base64Data, 'base64');
        console.log('SAVED_SUCCESSFULLY to ' + targetPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        setTimeout(() => process.exit(0), 1000);
      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(9879, () => {
  console.log('SERVER_READY on 9879');
});
