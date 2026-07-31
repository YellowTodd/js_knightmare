/**
 * One-shot converter: src_web/src (TypeScript) -> web/js (browser ES modules).
 *
 * The emitted JS is the source of truth from now on; this script exists so the
 * original conversion is reproducible and auditable, not as a build step you
 * need to run to play the game.
 *
 *   node tools/build-js.mjs
 *
 * Two things tsc does not do for us:
 *   1. It leaves import specifiers extensionless ("./audio"), which browsers
 *      cannot resolve. We append ".js" to every relative specifier.
 *   2. It emits type-only modules as empty files. Those are removed, along with
 *      any import of them left behind.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(projectRoot, "src_web", "src");
const outDir = join(projectRoot, "web", "js");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".js")) out.push(full);
  }
  return out;
}

rmSync(outDir, { recursive: true, force: true });

console.log("tsc -> web/js");
// Run tsc's entry script through this same Node binary - on Windows, Node 24
// refuses to spawnSync a .cmd shim (EINVAL).
execFileSync(
  process.execPath,
  [
    join(projectRoot, "node_modules", "typescript", "bin", "tsc"),
    "--target", "ES2022",
    "--module", "ESNext",
    "--moduleResolution", "Bundler",
    "--lib", "ES2022,DOM,DOM.Iterable",
    "--strict",
    "--skipLibCheck",
    "--removeComments", "false",
    "--newLine", "lf",
    "--rootDir", srcDir,
    "--outDir", outDir,
    // main.ts is the entry; tsc emits every module reachable from it.
    join(srcDir, "main.ts")
  ],
  { cwd: projectRoot, stdio: "inherit" }
);

const files = walk(outDir);

// Drop modules that carried nothing but types.
const emptyModules = new Set();
for (const file of files) {
  const body = readFileSync(file, "utf8").replace(/export\s*\{\s*\}\s*;?/g, "").trim();
  if (body === "") emptyModules.add(file);
}

let rewritten = 0;
for (const file of files) {
  if (emptyModules.has(file)) continue;
  const source = readFileSync(file, "utf8");

  const patched = source.replace(
    /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(["'])(\.\.?\/[^"']*?)\2/g,
    (match, head, quote, spec) => {
      if (/\.(js|mjs|json|css)$/.test(spec)) return match;
      return `${head}${quote}${spec}.js${quote}`;
    }
  );

  if (patched !== source) rewritten += 1;
  writeFileSync(file, patched.endsWith("\n") ? patched : `${patched}\n`);
}

for (const file of emptyModules) {
  rmSync(file);
  console.log(`removed type-only module: ${relative(projectRoot, file)}`);
}

console.log(`${files.length - emptyModules.size} modules emitted, ${rewritten} with rewritten specifiers`);
