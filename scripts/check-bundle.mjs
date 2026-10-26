import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join, dirname, sep } from "node:path";
import assert from "node:assert/strict";

const limit = 8_388_608;
const excluded = new Set([
  ".git",
  ".github",
  ".imd",
  "node_modules",
  ".playwright-mcp",
  ".cache",
  ".npm",
  ".vite",
  ".parcel-cache",
  "coverage",
]);
const files = [];
async function walk(dir, relative = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (
      excluded.has(entry.name) ||
      entry.name === ".env" ||
      entry.name.startsWith(".env.") ||
      (relative === "test" && entry.name === "scratch")
    )
      continue;
    const rel = join(relative, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${rel}`);
    if (entry.isDirectory()) await walk(join(dir, entry.name), rel);
    else if (entry.isFile()) {
      assert.ok(
        !/\.(tgz|tar|zip|tsbuildinfo)$/.test(rel),
        `Unnecessary packaging artifact: ${rel}`,
      );
      files.push({
        path: rel,
        bytes: (await stat(join(dir, entry.name))).size,
      });
    }
  }
}
await walk(process.cwd());
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
assert.ok(bytes < limit, `${bytes} bytes exceeds ${limit}`);
assert.ok(
  (await stat(".gitignore")).size <= 1000,
  ".gitignore exceeds its explicit path budget",
);
for (const required of [
  "dist/index.html",
  "README.md",
  "DESIGN.md",
  "package-lock.json",
  "docs/VALIDATION.md",
])
  await stat(required);
const distRoot = resolve("dist");
async function checkReference(from, reference) {
  assert.ok(
    !reference.startsWith("/") && !/^https?:/.test(reference),
    `Non-relative runtime asset: ${reference}`,
  );
  if (reference.startsWith("data:") || reference.startsWith("#")) return;
  const target = resolve(
    dirname(from),
    decodeURIComponent(reference.split(/[?#]/)[0]),
  );
  assert.ok(
    target.startsWith(distRoot + sep),
    `Reference leaves export: ${reference}`,
  );
  await stat(target);
}
const htmlPath = resolve("dist/index.html");
const html = await readFile(htmlPath, "utf8");
for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g))
  await checkReference(htmlPath, match[1]);
for (const match of html.matchAll(/property="og:image"\s+content="([^"]+)"/g))
  await checkReference(htmlPath, match[1]);
for (const file of files.filter(
  (file) => file.path.startsWith("dist/assets/") && file.path.endsWith(".css"),
)) {
  const cssPath = resolve(file.path);
  const css = await readFile(cssPath, "utf8");
  for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))
    await checkReference(cssPath, match[1]);
}
const distBytes = files
  .filter((file) => file.path.startsWith("dist/"))
  .reduce((sum, file) => sum + file.bytes, 0);
console.log(
  JSON.stringify(
    {
      passed: true,
      files: files.length,
      submissionBytes: bytes,
      limitBytes: limit,
      distBytes,
      remainingBytes: limit - bytes,
      runtimeAssets: "All HTML/CSS asset references are relative and present",
    },
    null,
    2,
  ),
);
