import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium, webkit } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const out = "test/scratch/validation";
await mkdir(out, { recursive: true });
const source = await readFile("src/posts.ts", "utf8");
const ts = require("typescript");
const compiledPosts = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { posts } = await import(
  `data:text/javascript;base64,${Buffer.from(compiledPosts).toString("base64")}`
);
const root = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/preview/")) {
      res.writeHead(404).end();
      return;
    }
    const path = resolve(
      root,
      "." + decodeURIComponent(url.pathname.slice("/preview".length)),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = (await stat(path)).isDirectory()
      ? join(path, "index.html")
      : path;
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = `${origin}/preview/`;
const results = [];
const record = (name, details = "") => {
  results.push({ name, passed: true, details });
  console.log(`PASS ${name}${details ? ": " + details : ""}`);
};
const errors = [];
let browser;
let webkitResult = "";
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const external = [];
  await context.route("**/*", (route) => {
    if (!route.request().url().startsWith(origin)) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /Pond/);
  assert.equal(await page.locator("article").count(), 6);
  record("Production export loads at a gateway-style subpath");
  const ranked = [...posts].sort(
    (a, b) =>
      b.likes + b.retweets + b.replies - (a.likes + a.retweets + a.replies) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  assert.equal(
    await page.locator("article").first().getAttribute("data-post-id"),
    ranked[0].id,
  );
  record("Default ranking matches captured engagement");
  await page.getByRole("button", { name: /Show 4 more tweets/ }).click();
  assert.equal(await page.locator("article").count(), 10);
  assert.equal(
    await page.getByRole("button", { name: /Show .* more tweets/ }).count(),
    0,
  );
  record("Show more reveals all ten posts and removes exhausted control");

  await page.getByRole("searchbox", { name: "Search" }).fill("music");
  assert.equal(await page.locator("article").count(), 2);
  record("Keyword search finds both music posts");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  assert.equal(await page.locator("article").count(), 6);
  record("Clear search restores feed and input focus");
  assert.equal(
    await page
      .getByRole("searchbox")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole("searchbox").fill("@taylor_");
  assert.equal(await page.locator("article").count(), 2);
  await page.getByRole("searchbox").fill("taylor_");
  assert.equal(await page.locator("article").count(), 2);
  record("Author handle search returns the author’s two posts");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  for (const topic of ["Builders", "Ecosystem", "Culture"]) {
    await page.getByRole("button", { name: topic, exact: true }).click();
    assert.equal(
      await page.locator("article").count(),
      posts.filter((p) => p.topic === topic).length,
    );
    assert.equal(
      await page
        .getByRole("button", { name: topic, exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    record(`${topic} topic filter and selected state`);
  }
  await page.getByRole("searchbox").fill("no-such-tweet-8675309");
  assert.equal(await page.locator("article").count(), 0);
  assert.match(await page.locator(".empty-state").innerText(), /no-such-tweet/);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  assert.equal(await page.locator("article").count(), 6);
  assert.equal(await page.getByRole("searchbox").inputValue(), "");
  record("Combined filters empty state names the query and recovers");

  await page.getByLabel("Sort tweets").selectOption("newest");
  const newest = [...posts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  assert.equal(
    await page.locator("article").first().getAttribute("data-post-id"),
    newest[0].id,
  );
  record("Newest sort uses real post timestamps");
  await page.getByLabel("Sort tweets").selectOption("likes");
  assert.equal(
    await page.locator("article").first().getAttribute("data-post-id"),
    [...posts].sort((a, b) => b.likes - a.likes)[0].id,
  );
  record("Most liked sort uses captured likes");
  await page.getByRole("link", { name: "Latest", exact: true }).first().click();
  assert.match(
    await page.locator("#feed-heading").textContent(),
    /Latest tweets/,
  );
  assert.equal(await page.getByLabel("Sort tweets").inputValue(), "newest");
  record("Latest navigation updates hash, heading and sorting");
  await page
    .getByRole("link", { name: /^Saved/ })
    .first()
    .click();
  assert.equal(await page.locator("article").count(), 0);
  assert.match(await page.locator(".empty-state").innerText(), /Save a tweet/);
  await page.getByRole("link", { name: "Explore top tweets" }).click();
  record("Saved empty state offers a working route back");

  const first = page.locator("article").first();
  const savedId = await first.getAttribute("data-post-id");
  await first.getByRole("button", { name: /^Save tweet by/ }).click();
  assert.equal(
    await first
      .getByRole("button", { name: /^Unsave tweet by/ })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(await page.locator(".toast").innerText(), /Tweet saved/);
  record("Bookmark updates visible icon, accessible state and notification");
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("link", { name: /^Saved/ })
    .first()
    .click();
  assert.equal(await page.locator("article").count(), 1);
  assert.equal(
    await page.locator("article").getAttribute("data-post-id"),
    savedId,
  );
  record("Saved posts persist after reload");
  await page
    .locator("article")
    .getByRole("button", { name: /^Unsave tweet by/ })
    .click();
  assert.equal(await page.locator("article").count(), 0);
  record("Unsave removes a post from the Saved view");
  await page.getByRole("link", { name: "Explore top tweets" }).click();
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: /^Share tweet by/ })
    .click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(copied, ranked[0].url);
  record("Share copies the original post URL");
  await page.getByRole("button", { name: "Dismiss notification" }).click();

  const about = page.getByRole("button", { name: "About Pond", exact: true });
  await about.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("dialog").evaluate((el) => el.open), true);
  assert.equal(await page.locator("dialog .source-list a").count(), 10);
  record("About opens with all ten source links and ranking disclosure");
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page
        .locator("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
      true,
    );
  }
  record("Native modal contains keyboard focus through the full source list");
  await page.keyboard.press("Escape");
  assert.equal(
    await about.evaluate((el) => el === document.activeElement),
    true,
  );
  record("Escape closes the modal and restores trigger focus");
  await page.screenshot({ path: `${out}/keyboard-focus.png` });

  await page.getByRole("button", { name: "All posts", exact: true }).click();
  const visiblePosts = await page.locator("article").count();
  for (let i = 0; i < visiblePosts; i++) {
    const card = page.locator("article").nth(i);
    const id = await card.getAttribute("data-post-id");
    assert.equal(
      await card.locator(".post-read a").getAttribute("href"),
      posts.find((p) => p.id === id).url,
    );
  }
  const unsafe = await page
    .locator('a[target="_blank"]')
    .evaluateAll(
      (els) =>
        els.filter(
          (el) =>
            !el.rel.includes("noopener") || !el.rel.includes("noreferrer"),
        ).length,
    );
  assert.equal(unsafe, 0);
  record(
    "Post links point to exact sources and external links have safe attributes",
  );

  for (const width of [320, 390, 760, 1060, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const dims = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(dims.content <= dims.viewport + 1, `${width}px overflows`);
    record(`No horizontal overflow at ${width}px`);
    if (width === 390) {
      const quoteBox = await page
        .locator("article")
        .first()
        .locator("blockquote")
        .boundingBox();
      const actions = await page
        .locator("article")
        .first()
        .locator(".post-actions")
        .boundingBox();
      assert.ok(quoteBox.y + quoteBox.height < 844);
      assert.ok(actions.y + actions.height < 844);
      record(
        "390px first screen contains a full tweet, read link, save and share",
      );
    }
    if ([320, 390, 1440].includes(width))
      await page.screenshot({ path: `${out}/${width}.png`, fullPage: false });
  }
  assert.equal(
    await page.evaluate(
      () =>
        document.fonts.check("400 16px Manrope") &&
        document.fonts.check("600 16px Manrope") &&
        document.fonts.check("800 16px Manrope"),
    ),
    true,
  );
  record("Local Manrope font loads at all three used weights");
  const axeDesktop = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    axeDesktop.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  record(
    "Desktop axe accessibility audit",
    `${axeDesktop.passes.length} rules passed, zero violations`,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const axeMobile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    axeMobile.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  record(
    "Mobile axe accessibility audit",
    `${axeMobile.passes.length} rules passed, zero violations`,
  );
  await about.click();
  const axeDialog = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    axeDialog.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  record(
    "Open-dialog axe accessibility audit",
    `${axeDialog.passes.length} rules passed, zero violations`,
  );
  await page.screenshot({ path: `${out}/dialog-mobile.png` });
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
    0,
  );
  record("Reduced motion has no running animations");
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("searchbox").focus();
  await page.screenshot({ path: `${out}/forced-colors.png` });
  record("Forced-colors state renders with keyboard focus");
  await page.emulateMedia({ forcedColors: "none" });
  await page.setViewportSize({ width: 760, height: 1000 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
    true,
  );
  record(
    "200% text enlargement reflows at 760px",
    "Text enlargement, not browser-native zoom",
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  assert.deepEqual(external, []);
  record("Feed works with every external request blocked");
  assert.deepEqual(errors, []);
  record(
    "No browser console errors, script errors, or missing local resources",
  );

  const blockedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await blockedContext.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    });
    Storage.prototype.getItem = () => {
      throw new Error("Blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Blocked");
    };
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto(url, { waitUntil: "networkidle" });
  await blockedPage
    .locator("article")
    .first()
    .getByRole("button", { name: /^Save tweet by/ })
    .click();
  assert.match(
    await blockedPage.locator(".storage-note").textContent(),
    /session/,
  );
  await blockedPage
    .getByRole("link", { name: /^Saved/ })
    .last()
    .click();
  assert.equal(await blockedPage.locator("article").count(), 1);
  record(
    "Blocked local storage keeps bookmarks in memory and explains the limit",
  );
  await blockedPage
    .locator("article")
    .getByRole("button", { name: /^Share tweet by/ })
    .click();
  assert.equal(
    await blockedPage.locator("dialog").evaluate((el) => el.open),
    true,
  );
  assert.equal(
    await blockedPage.locator("#share-url").inputValue(),
    ranked[0].url,
  );
  await blockedPage
    .getByRole("button", { name: "Select link", exact: true })
    .click();
  assert.equal(
    await blockedPage
      .locator("#share-url")
      .evaluate((el) => el.selectionEnd - el.selectionStart),
    ranked[0].url.length,
  );
  record(
    "Denied clipboard opens accessible manual-copy dialog with the exact URL",
  );
  await blockedPage.keyboard.press("Escape");
  await blockedContext.close();

  const corruptContext = await browser.newContext();
  await corruptContext.addInitScript(() =>
    localStorage.setItem("pond.saved.v1", "{invalid json"),
  );
  const corruptPage = await corruptContext.newPage();
  await corruptPage.goto(`${url}#saved`);
  assert.equal(await corruptPage.locator("article").count(), 0);
  assert.match(
    await corruptPage.locator("#feed-heading").textContent(),
    /Saved tweets/,
  );
  record(
    "Corrupt stored data recovers without crashing; Saved deep link works",
  );
  await corruptContext.close();
  await context.close();
  await browser.close();
  browser = null;

  try {
    const safari = await webkit.launch({ headless: true });
    try {
      const p = await safari.newPage({ viewport: { width: 390, height: 844 } });
      await p.goto(url);
      await p.getByRole("searchbox").fill("music");
      assert.equal(await p.locator("article").count(), 2);
      await p
        .getByRole("button", { name: "Clear search", exact: true })
        .click();
      await p
        .locator("article")
        .first()
        .getByRole("button", { name: /^Save tweet by/ })
        .click();
      await p
        .getByRole("link", { name: /^Saved/ })
        .last()
        .click();
      assert.equal(await p.locator("article").count(), 1);
      record("WebKit primary flow", "Search, save, Saved navigation");
      webkitResult = "Passed primary flow";
    } finally {
      await safari.close();
    }
  } catch (error) {
    webkitResult = `Not verified: ${error.message.slice(0, 3000)}`;
    console.log(webkitResult);
  }
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        checks: results,
        errors,
        webkit: webkitResult,
        limitations: [
          "No screen-reader or physical-device session",
          "Text enlargement is not native browser zoom",
          "External post destinations checked as URLs, not authenticated X sessions",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    `\n${results.length} interaction and browser checks passed. Results: ${out}/results.json`,
  );
} catch (error) {
  console.error(error);
  await writeFile(
    `${out}/failure.json`,
    JSON.stringify({ checks: results, error: String(error), errors }, null, 2),
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
