const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

function sendFile(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, status === 404 ? 404 : 500, status === 404 ? 'Not found' : 'Server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    send(res, status, data, mimeTypes[ext] || 'application/octet-stream');
  });
}

function resolveRequestPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = cleanPath === '/' ? '/index.html' : cleanPath;
  const targetPath = path.resolve(root, `.${relativePath}`);
  if (!targetPath.startsWith(root)) return null;
  return targetPath;
}

const server = http.createServer((req, res) => {
  const targetPath = resolveRequestPath(req.url || '/');
  if (!targetPath) {
    send(res, 403, 'Forbidden');
    return;
  }

  let filePath = targetPath;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    const notFoundPath = path.join(root, '404.html');
    if (fs.existsSync(notFoundPath)) {
      sendFile(res, notFoundPath, 404);
      return;
    }

    send(res, 404, 'Not found');
    return;
  }

  sendFile(res, filePath, 200);
});

server.listen(port, () => {
  console.log(`UGS test server listening on http://127.0.0.1:${port}`);
});
