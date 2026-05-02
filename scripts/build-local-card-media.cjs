const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const gamesDataPath = path.join(root, "games-data.js");
const mediaMapPath = path.join(root, "game-card-media.js");
const outDir = path.join(root, process.env.MEDIA_LOCAL_OUT_DIR || "card-media", "generated");

const baseUrl = process.env.MEDIA_LOCAL_BASE_URL || "http://127.0.0.1:4173";
const onlyFallbacks = process.env.MEDIA_LOCAL_ONLY_FALLBACKS !== "0";
const replaceAll = process.env.MEDIA_LOCAL_REPLACE_ALL === "1";
const maxGames = Number(process.env.MEDIA_LOCAL_MAX_GAMES || 0);
const delayMs = Number(process.env.MEDIA_LOCAL_DELAY_MS || 250);
const waitAfterLoadMs = Number(process.env.MEDIA_LOCAL_WAIT_MS || 800);
const navTimeoutMs = Number(process.env.MEDIA_LOCAL_NAV_TIMEOUT_MS || 25000);
const retryCommitTimeoutMs = Number(process.env.MEDIA_LOCAL_RETRY_COMMIT_TIMEOUT_MS || 8000);
const dryRun = process.env.MEDIA_LOCAL_DRY_RUN === "1";

const viewWidth = Number(process.env.MEDIA_LOCAL_WIDTH || 960);
const viewHeight = Number(process.env.MEDIA_LOCAL_HEIGHT || 540);
const jpegQuality = Number(process.env.MEDIA_LOCAL_JPEG_QUALITY || 72);
const fallbackImage = "favicon.png";

function parseGames() {
  const text = fs.readFileSync(gamesDataPath, "utf8");
  const sandbox = {};
  vm.runInNewContext(text, sandbox);
  return Array.isArray(sandbox.rawGames) ? sandbox.rawGames : [];
}

function readMediaMap() {
  const text = fs.readFileSync(mediaMapPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(text, sandbox);
  return sandbox.window.gameCardMediaMap || {};
}

function writeMediaMap(mediaMap) {
  const keys = Object.keys(mediaMap).sort((a, b) => a.localeCompare(b));
  const lines = keys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(mediaMap[key])}`);
  const output = ["window.gameCardMediaMap = {", lines.join(",\n"), "};", ""].join("\n");
  fs.writeFileSync(mediaMapPath, output, "utf8");
}

function safeSlug(gameUrl) {
  const base = path.basename(gameUrl, path.extname(gameUrl));
  let slug = base.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!slug) {
    const hex = Buffer.from(gameUrl, "utf8").toString("hex").slice(0, 20);
    slug = `game-${hex}`;
  }
  return slug;
}

function shouldCapture(game, mediaMap) {
  const current = mediaMap[game.url];
  if (!current) return true;
  if (replaceAll) return true;
  if (onlyFallbacks) return current === fallbackImage;
  return true;
}

async function sleep(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url) {
  for (let i = 0; i < 20; i += 1) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 404) return true;
    } catch (error) {
      // ignore
    }
    await sleep(250);
  }
  return false;
}

function maybeStartServer() {
  return new Promise(async (resolve) => {
    const online = await waitForServer(baseUrl);
    if (online) {
      resolve({ proc: null, started: false });
      return;
    }

    const serverProc = spawn(process.execPath, [path.join(root, "scripts", "test-server.cjs")], {
      cwd: root,
      stdio: "ignore",
    });

    const ready = await waitForServer(baseUrl);
    if (!ready) {
      try {
        serverProc.kill("SIGTERM");
      } catch (error) {
        // ignore
      }
      throw new Error(`Could not start local test server at ${baseUrl}`);
    }

    resolve({ proc: serverProc, started: true });
  });
}

async function captureAll() {
  const games = parseGames();
  const mediaMap = readMediaMap();
  const queue = games.filter((game) => shouldCapture(game, mediaMap));
  const targets = maxGames > 0 ? queue.slice(0, maxGames) : queue;

  if (!fs.existsSync(outDir) && !dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const server = await maybeStartServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: viewWidth,
      height: viewHeight,
    },
  });

  let captured = 0;
  let failed = 0;

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Games in catalog: ${games.length}`);
  console.log(`Targets this run: ${targets.length}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);

  for (let i = 0; i < targets.length; i += 1) {
    const game = targets[i];
    const gameUrl = `${baseUrl}/${game.url.replace(/^\/+/, "")}`;
    const fileName = `${safeSlug(game.url)}.jpg`;
    const absOut = path.join(outDir, fileName);
    const relativeOut = path.relative(root, absOut).replace(/\\/g, "/");

    try {
      try {
        await page.goto(gameUrl, { waitUntil: "domcontentloaded", timeout: navTimeoutMs });
      } catch (firstError) {
        // Some pages never reach DOMContentLoaded due to heavy boot scripts.
        // Retry with a lighter readiness target so we can still capture a useful card image.
        await page.goto(gameUrl, { waitUntil: "commit", timeout: retryCommitTimeoutMs });
      }
      await sleep(waitAfterLoadMs);

      if (!dryRun) {
        await page.screenshot({
          path: absOut,
          type: "jpeg",
          quality: jpegQuality,
          fullPage: false,
        });
      }

      mediaMap[game.url] = relativeOut;
      captured += 1;
      console.log(`[${i + 1}/${targets.length}] ok   ${game.url} -> ${relativeOut}`);
    } catch (error) {
      failed += 1;
      console.log(`[${i + 1}/${targets.length}] fail ${game.url} :: ${error.message}`);
    }

    await sleep(delayMs);
  }

  await page.close();
  await browser.close();

  if (server.proc) {
    try {
      server.proc.kill("SIGTERM");
    } catch (error) {
      // ignore
    }
  }

  if (!dryRun) {
    writeMediaMap(mediaMap);
  }

  console.log("");
  console.log(`Captured: ${captured}`);
  console.log(`Failed: ${failed}`);
  console.log(dryRun ? "Dry run only. No files or map were written." : `Updated ${path.basename(mediaMapPath)}`);
}

captureAll().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
