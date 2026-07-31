/**
 * Zero-dependency static file server for web/.
 *
 *   node tools/serve.mjs [port]
 *
 * The game is plain HTML + ES modules, so any static server works - this one
 * just avoids needing Python or a global npm package. A server is required
 * because browsers block ES module imports and fetch() over file://.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "web");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8080);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".map": "application/octet-stream"
};

const server = createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const relativePath = normalize(requestPath).replace(/^[/\\]+/, "");
  const filePath = join(ROOT, relativePath === "" ? "index.html" : relativePath);

  // Never serve anything outside web/.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    res.writeHead(403).end("403 Forbidden");
    return;
  }

  const target = existsSync(filePath) && statSync(filePath).isDirectory()
    ? join(filePath, "index.html")
    : filePath;

  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(target).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": statSync(target).size,
    // Always reflect the files on disk - this is a development server.
    "Cache-Control": "no-cache"
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, "localhost", () => {
  console.log(`Knightmare ready at http://localhost:${PORT}/  (serving ${ROOT})`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try: node tools/serve.mjs 8081`);
    process.exit(1);
  }
  throw error;
});
