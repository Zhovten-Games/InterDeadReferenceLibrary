import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

function resolveContentType(filepath) {
  if (filepath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filepath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filepath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filepath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filepath.endsWith('.png')) return 'image/png';
  if (filepath.endsWith('.mp3')) return 'audio/mpeg';
  return 'application/octet-stream';
}

export class WebPreviewServer {
  constructor({ workdir, appRoot, logger, staticFiles = {} }) {
    this.workdir = workdir;
    this.appRoot = appRoot;
    this.logger = logger;
    this.staticFiles = new Map(Object.entries(staticFiles));
    this.server = null;
    this.port = null;
  }

  safeResolve(base, relativePath) {
    const normalizedBase = path.resolve(base);
    const resolved = path.resolve(normalizedBase, `.${relativePath}`);
    const relative = path.relative(normalizedBase, resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return null;
    }

    return resolved;
  }

  createServer() {
    return http.createServer((req, res) => {
      const requestPath = (req.url ?? '/').split('?')[0];
      const mountedPath = this.staticFiles.get(requestPath);
      if (mountedPath) {
        if (!fs.existsSync(mountedPath) || fs.statSync(mountedPath).isDirectory()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        res.setHeader('Content-Type', resolveContentType(mountedPath));
        fs.createReadStream(mountedPath).pipe(res);
        return;
      }

      const normalizedPath = requestPath === '/' ? '/scene.html' : requestPath;
      const appPath = this.safeResolve(this.appRoot, normalizedPath);
      const workPath = this.safeResolve(this.workdir, normalizedPath);
      const sourcePath = appPath && fs.existsSync(appPath) ? appPath : workPath;

      if (!sourcePath || !fs.existsSync(sourcePath) || fs.statSync(sourcePath).isDirectory()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      res.setHeader('Content-Type', resolveContentType(sourcePath));
      fs.createReadStream(sourcePath).pipe(res);
    });
  }

  async start(port = 4173) {
    this.server = this.createServer();
    await new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(port, '127.0.0.1', resolve);
    });
    const address = this.server.address();
    this.port = typeof address === 'object' && address ? address.port : port;
    this.logger.info(`Preview server is running at http://127.0.0.1:${this.port}`);
  }

  async stop() {
    if (!this.server) return;
    await new Promise((resolve, reject) => this.server.close((error) => (error ? reject(error) : resolve())));
    this.server = null;
    this.port = null;
  }
}
