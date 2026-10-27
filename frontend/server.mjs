import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";
const API_TARGET = new URL(process.env.API_TARGET || "http://127.0.0.1:5050");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const COMPRESSIBLE_EXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".txt", ".map", ".svg"]);

const compressionCache = new Map();

function pickEncoding(header = "") {
  let brotli = false;
  let gzip = false;
  for (const part of header.split(",")) {
    const [name, ...params] = part.trim().toLowerCase().split(";");
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.split("=")[1]) : 1;
    if (!Number.isFinite(q) || q <= 0) continue;
    if (name === "br") brotli = true;
    if (name === "gzip") gzip = true;
  }
  return brotli ? "br" : gzip ? "gzip" : null;
}

function compress(buffer, encoding) {
  if (encoding === "br") {
    return zlib.brotliCompressSync(buffer, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
    });
  }
  return zlib.gzipSync(buffer, { level: 6 });
}

function sendText(res, status, text) {
  const body = Buffer.from(text);
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function parseUrl(req) {
  try {
    return new URL(req.url, "http://localhost");
  } catch {
    return null;
  }
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function proxyApi(req, res) {
  const transport = API_TARGET.protocol === "https:" ? https : http;
  const targetPath = parseUrl(req);
  if (!targetPath) {
    sendText(res, 400, "Bad Request");
    return;
  }

  const proxyReq = transport.request(
    {
      protocol: API_TARGET.protocol,
      hostname: API_TARGET.hostname,
      port: API_TARGET.port || (API_TARGET.protocol === "https:" ? 443 : 80),
      path: targetPath.pathname + targetPath.search,
      method: req.method,
      headers: { ...req.headers, host: API_TARGET.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`[cupid] proxy error ${req.method} ${req.url}: ${err.code || err.message}`);
    if (!res.headersSent) {
      sendJson(res, 502, {
        error: { code: "proxy_error", message: "เชื่อมต่อเซิร์ฟเวอร์ API ไม่สำเร็จ" },
      });
    } else {
      res.destroy();
    }
  });

  req.on("aborted", () => proxyReq.destroy());
  req.pipe(proxyReq);
}

function serveFile(req, res, filePath, stat) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const isHashedAsset = filePath.startsWith(path.join(DIST, "assets") + path.sep);
  const headers = {
    "Content-Type": type,
    "Cache-Control": isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
    ETag: etag,
    Vary: "Accept-Encoding",
    "X-Content-Type-Options": "nosniff",
  };

  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 500, "Internal Server Error");
      return;
    }

    let body = data;
    if (COMPRESSIBLE_EXT.has(ext) && data.length > 1024) {
      const encoding = pickEncoding(req.headers["accept-encoding"]);
      if (encoding) {
        const key = `${encoding}:${filePath}:${Math.floor(stat.mtimeMs)}:${stat.size}`;
        body = compressionCache.get(key);
        if (!body) {
          body = compress(data, encoding);
          compressionCache.set(key, body);
        }
        headers["Content-Encoding"] = encoding;
      }
    }

    headers["Content-Length"] = body.length;
    res.writeHead(200, headers);
    if (req.method === "HEAD") {
      res.end();
    } else {
      res.end(body);
    }
  });
}

function serveStatic(req, res) {
  const url = parseUrl(req);
  if (!url) {
    sendText(res, 400, "Bad Request");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendText(res, 400, "Bad Request");
    return;
  }

  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(DIST, "." + pathname);
  if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serveFile(req, res, filePath, stat);
      return;
    }

    if (pathname.startsWith("/assets/")) {
      sendText(res, 404, "Not Found");
      return;
    }

    const acceptsHtml =
      (req.headers.accept || "").includes("text/html") || path.extname(pathname) === "";
    if (!acceptsHtml) {
      sendText(res, 404, "Not Found");
      return;
    }

    const indexPath = path.join(DIST, "index.html");
    fs.stat(indexPath, (indexErr, indexStat) => {
      if (indexErr || !indexStat.isFile()) {
        sendText(res, 404, "Not Found");
        return;
      }
      serveFile(req, res, indexPath, indexStat);
    });
  });
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error(`[cupid] dist/index.html not found at ${DIST}`);
  console.error('[cupid] Run "npm run build" before starting the production server.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendText(res, 400, "Bad Request");
    return;
  }

  const url = parseUrl(req);
  if (!url) {
    sendText(res, 400, "Bad Request");
    return;
  }

  const pathname = url.pathname;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": 18,
    });
    res.end("Method Not Allowed");
    return;
  }

  serveStatic(req, res);
});

server.on("clientError", (_err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

server.listen(PORT, HOST, () => {
  console.log(`[cupid] serving ${DIST}`);
  console.log(`[cupid] listening on http://${HOST}:${PORT} (API -> ${API_TARGET.href})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
