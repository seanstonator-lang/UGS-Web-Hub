const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const gamesDataPath = path.join(root, "games-data.js");
const gameTitlesPath = path.join(root, "games-titles.js");
const mediaMapPath = path.join(root, "game-card-media.js");

const delayMs = Number(process.env.BING_MEDIA_DELAY_MS || 450);
const maxGames = Number(process.env.BING_MEDIA_MAX_GAMES || 0);
const onlyGenerated = process.env.BING_MEDIA_ONLY_GENERATED !== "0";
const dryRun = process.env.BING_MEDIA_DRY_RUN === "1";
const strict = process.env.BING_MEDIA_STRICT === "1";

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  const blocked = new Set(["the", "and", "game", "online", "free", "for", "with", "edition"]);
  return normalize(value)
    .split(" ")
    .filter((t) => t.length >= 3 && !blocked.has(t));
}

function readScriptObject(filePath, key) {
  const code = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window[key] || sandbox[key] || {};
}

function parseGames() {
  const code = fs.readFileSync(gamesDataPath, "utf8");
  const sandbox = {};
  vm.runInNewContext(code, sandbox);
  return Array.isArray(sandbox.rawGames) ? sandbox.rawGames : [];
}

function writeMediaMap(map) {
  const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])}`);
  const out = ["window.gameCardMediaMap = {", lines.join(",\n"), "};", ""].join("\n");
  fs.writeFileSync(mediaMapPath, out, "utf8");
}

function shouldProcess(gameUrl, mediaMap) {
  const current = mediaMap[gameUrl] || "";
  if (!current) return true;
  if (!onlyGenerated) return true;
  return current === "favicon.png" || current.startsWith("card-media/generated/");
}

function extractCandidates(html) {
  const out = [];

  // Bing image result payloads live in m="{...}" attributes.
  for (const match of html.matchAll(/\sm=\"({[^\"]+})\"/g)) {
    try {
      const decoded = match[1].replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.murl) {
        out.push({
          url: String(parsed.murl),
          pageUrl: parsed.purl ? String(parsed.purl) : "",
        });
      }
    } catch (error) {
      // ignore bad JSON snippets
    }
  }

  return out;
}

function scoreUrl(url, pageUrl, title, queryTokens) {
  const lower = url.toLowerCase();
  const lowerPage = (pageUrl || "").toLowerCase();
  if (!/^https?:\/\//.test(url)) return -1000;
  if (!/\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(url)) return -600;
  if (/favicon|sprite|icon-16|icon-32|logo-small|button/.test(lower)) return -350;

  let score = 100;

  for (const t of queryTokens) {
    if (lower.includes(t)) score += 20;
    if (lowerPage.includes(t)) score += 8;
  }

  const tks = tokens(title);
  for (const t of tks) {
    if (lower.includes(t)) score += 8;
  }

  if (/cover|screenshot|screen|thumbnail|thumb|banner|hero|promo|boxart/.test(lower)) score += 40;
  if (/logo|icon/.test(lower)) score -= 20;
  if (/\.png(\?|#|$)/i.test(lower)) score += 8;
  if (/\.webp(\?|#|$)/i.test(lower)) score += 5;

  return score;
}

async function searchBing(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&form=HDRSC2`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`bing ${res.status}`);
  }
  const html = await res.text();
  return extractCandidates(html);
}

async function sleep(ms) {
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const games = parseGames();
  const titleMap = readScriptObject(gameTitlesPath, "gameTitleMap");
  const mediaMap = readScriptObject(mediaMapPath, "gameCardMediaMap");

  const queue = games.filter((g) => shouldProcess(g.url, mediaMap));
  const targets = maxGames > 0 ? queue.slice(0, maxGames) : queue;

  console.log(`Games total: ${games.length}`);
  console.log(`Candidates: ${targets.length}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "write"}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const game = targets[i];
    const title = titleMap[game.url] || game.name || game.url;
    const query = `"${title}" game cover screenshot`;
    const qTokens = tokens(title);

    try {
      const candidates = await searchBing(query);
      const ranked = candidates
        .map((item) => ({ ...item, score: scoreUrl(item.url, item.pageUrl, title, qTokens) }))
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      const minScore = strict ? 130 : 85;

      if (best && best.score >= minScore) {
        mediaMap[game.url] = best.url;
        updated += 1;
        console.log(`[${i + 1}/${targets.length}] ok   ${game.url} -> ${best.url} (${best.score})`);
      } else {
        skipped += 1;
        console.log(`[${i + 1}/${targets.length}] skip ${game.url}`);
      }
    } catch (error) {
      failed += 1;
      console.log(`[${i + 1}/${targets.length}] fail ${game.url} :: ${error.message}`);
    }

    if (!dryRun && (i + 1) % 25 === 0) {
      writeMediaMap(mediaMap);
      console.log(`checkpoint: ${i + 1}/${targets.length}`);
    }

    await sleep(delayMs);
  }

  if (!dryRun) {
    writeMediaMap(mediaMap);
  }

  const fallback = Object.values(mediaMap).filter((value) => value === "favicon.png").length;
  const generated = Object.values(mediaMap).filter((value) => typeof value === "string" && value.startsWith("card-media/generated/")).length;

  console.log("");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Generated-local remaining: ${generated}`);
  console.log(`Fallback remaining: ${fallback}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
