import { createReadStream, existsSync, rmSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/**
 * Runtime game assets live next to the built output in `web/`, not in a
 * separate public dir. `web/` also contains a previous build (index.html,
 * assets/), so it cannot be used as Vite's publicDir - that stale index.html
 * would shadow the dev entry point. Instead only the asset folders below are
 * served from `web/` during `vite dev`.
 */
const ASSET_ROOT = resolve(projectRoot, "web");
const ASSET_DIRS = ["images", "maps", "music", "sfx", "tiles"];

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".map": "application/octet-stream"
};

function serveGameAssets(): Plugin {
  return {
    name: "serve-game-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();

        const pathname = decodeURIComponent((req.url ?? "").split("?")[0] ?? "");
        const topDir = pathname.split("/")[1];
        if (!topDir || !ASSET_DIRS.includes(topDir)) return next();

        const filePath = join(ASSET_ROOT, pathname);
        if (!filePath.startsWith(ASSET_ROOT)) return next();
        if (!existsSync(filePath)) return next();

        const stats = statSync(filePath);
        if (!stats.isFile()) return next();

        res.setHeader("Content-Type", MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream");
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Cache-Control", "no-cache");
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        createReadStream(filePath).pipe(res);
      });
    }
  };
}

/**
 * `emptyOutDir` must stay off - wiping `web/` would delete the game assets.
 * Instead clear only `web/assets/`, which is pure build output, so old hashed
 * bundles don't pile up build after build.
 */
function cleanBuildAssets(): Plugin {
  let assetsDir = "";
  return {
    name: "clean-build-assets",
    apply: "build",
    configResolved(config) {
      assetsDir = resolve(config.root, config.build.outDir, config.build.assetsDir);
    },
    buildStart() {
      if (assetsDir && existsSync(assetsDir)) rmSync(assetsDir, { recursive: true, force: true });
    }
  };
}

export default defineConfig({
  root: "src_web",
  publicDir: false,
  plugins: [serveGameAssets(), cleanBuildAssets()],
  server: {
    host: "localhost",
    port: 8080,
    strictPort: true,
    // VS Code opens the browser through the debugger (F5), so don't open a
    // second one here. `npm run dev` alone still prints the URL.
    open: false
  },
  preview: {
    host: "localhost",
    // Must stay in sync with the preview URL in .vscode/launch.json - without
    // strictPort a busy 4173 would silently move the server to another port.
    port: 4173,
    strictPort: true,
    open: false
  },
  build: {
    // `web/` is the dist folder; keep the sibling asset folders intact.
    outDir: "../web",
    emptyOutDir: false,
    sourcemap: false
  }
});
