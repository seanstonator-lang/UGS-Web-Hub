const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const gamesDataPath = path.join(root, "games-data.js");
const gameTitlesPath = path.join(root, "games-titles.js");
const cardMediaPath = path.join(root, "game-card-media.js");

const SEARCH_PROVIDER = (process.env.MEDIA_SEARCH_PROVIDER || "serpapi").toLowerCase();
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";

const ONLY_FALLBACKS = process.env.MEDIA_ONLY_FALLBACKS !== "0";
const MAX_GAMES = Number(process.env.MEDIA_MAX_GAMES || 0);
const REQUEST_DELAY_MS = Number(process.env.MEDIA_DELAY_MS || 250);
const DRY_RUN = process.env.MEDIA_DRY_RUN === "1";
const STRICT_MATCH = process.env.MEDIA_STRICT_MATCH !== "0";

const FALLBACK_IMAGE = "favicon.png";
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i;
const BLOCKED_SNIPPETS = [
  "favicon",
  "apple-touch-icon",
  "icon-16",
  "icon-32",
  "sprite",
  "button",
  "avatar",
  "logo",
  "steamcommunity",
  "wikipedia.org",
  "wikimedia.org",
];

function readScriptObject(filePath, globalKey) {
  const text = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(text, sandbox);
  if (sandbox.window && sandbox.window[globalKey]) return sandbox.window[globalKey];
  if (sandbox[globalKey]) return sandbox[globalKey];
  return {};
}

function parseGames() {
  const text = fs.readFileSync(gamesDataPath, "utf8");
  const sandbox = {};
  vm.runInNewContext(text, sandbox);
  return Array.isArray(sandbox.rawGames) ? sandbox.rawGames : [];
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleTokens(title) {
  const stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "game", "edition", "online"]);
  return normalize(title)
    .split(" ")
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function buildQuery(game, title) {
  const typeHint = game.type === "emulated" ? `${game.system || "retro"} game` : "browser game";
  return `${title} ${typeHint} cover screenshot`;
}

function scoreCandidate(url, sourceTitle, queryTokens) {
  const lowerUrl = (url || "").toLowerCase();
  if (!/^https?:\/\//i.test(url)) return -1000;
  if (!IMAGE_EXTENSIONS.test(url)) return -900;
  if (BLOCKED_SNIPPETS.some((snippet) => lowerUrl.includes(snippet))) return -700;

  let score = 100;

  for (const token of queryTokens) {
    if (lowerUrl.includes(token)) score += 22;
  }

  const normSource = normalize(sourceTitle);
  for (const token of normSource.split(" ").filter(Boolean)) {
    if (token.length >= 3 && lowerUrl.includes(token)) score += 10;
  }

  if (/\b(cover|splash|screenshot|thumb|thumbnail|banner|promo)\b/i.test(lowerUrl)) score += 40;
  if (/\b(icon|logo|favicon)\b/i.test(lowerUrl)) score -= 55;
  if (/\.png(\?|#|$)/i.test(lowerUrl)) score += 8;
  if (/\.webp(\?|#|$)/i.test(lowerUrl)) score += 6;
  if (/\.jpe?g(\?|#|$)/i.test(lowerUrl)) score += 4;

  return score;
}

async function searchSerpApi(query) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY is missing.");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", SERPAPI_KEY);
  url.searchParams.set("safe", "active");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`SerpApi failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const images = Array.isArray(data.images_results) ? data.images_results : [];
  return images
    .map((item) => ({
      url: item.original || item.thumbnail || "",
      title: item.title || "",
      source: item.source || "",
    }))
    .filter((item) => !!item.url);
}

async function searchBrave(query) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY is missing.");
  const url = new URL("https://api.search.brave.com/res/v1/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "20");
  url.searchParams.set("safesearch", "strict");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });
  if (!res.ok) throw new Error(`Brave failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const items = Array.isArray(data.results) ? data.results : [];
  return items
    .map((item) => ({
      url: item.properties?.url || item.thumbnail?.src || "",
      title: item.title || "",
      source: item.meta_url?.hostname || "",
    }))
    .filter((item) => !!item.url);
}

async function searchImages(query) {
  if (SEARCH_PROVIDER === "brave") return searchBrave(query);
  return searchSerpApi(query);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeMediaMap(mediaMap) {
  const keys = Object.keys(mediaMap).sort((a, b) => a.localeCompare(b));
  const lines = keys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(mediaMap[key])}`);
  const output = ["window.gameCardMediaMap = {", lines.join(",\n"), "};", ""].join("\n");
  fs.writeFileSync(cardMediaPath, output, "utf8");
}

async function main() {
  const games = parseGames();
  const titleMap = readScriptObject(gameTitlesPath, "gameTitleMap");
  const mediaMap = readScriptObject(cardMediaPath, "gameCardMediaMap");

  const queue = games.filter((game) => {
    if (!mediaMap[game.url]) return true;
    if (!ONLY_FALLBACKS) return true;
    return mediaMap[game.url] === FALLBACK_IMAGE;
  });

  const limitedQueue = MAX_GAMES > 0 ? queue.slice(0, MAX_GAMES) : queue;
  const providerName = SEARCH_PROVIDER === "brave" ? "Brave Image Search" : "SerpApi Google Images";

  console.log(`Provider: ${providerName}`);
  console.log(`Candidates to enrich: ${limitedQueue.length}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < limitedQueue.length; i += 1) {
    const game = limitedQueue[i];
    const displayTitle = titleMap[game.url] || game.name || game.url;
    const query = buildQuery(game, displayTitle);
    const tokens = titleTokens(displayTitle);

    try {
      const results = await searchImages(query);
      const ranked = results
        .map((item) => ({
          ...item,
          score: scoreCandidate(item.url, `${displayTitle} ${item.title} ${item.source}`, tokens),
        }))
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      const minimumScore = STRICT_MATCH ? 135 : 100;

      if (best && best.score >= minimumScore) {
        mediaMap[game.url] = best.url;
        updated += 1;
        console.log(`[${i + 1}/${limitedQueue.length}] ok  ${displayTitle} -> ${best.url} (score ${best.score})`);
      } else {
        skipped += 1;
        console.log(`[${i + 1}/${limitedQueue.length}] skip ${displayTitle} (no strong match)`);
      }
    } catch (error) {
      failed += 1;
      console.log(`[${i + 1}/${limitedQueue.length}] fail ${displayTitle} :: ${error.message}`);
    }

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  if (!DRY_RUN) {
    writeMediaMap(mediaMap);
  }

  const totalMapped = Object.keys(mediaMap).length;
  const fallbackCount = Object.values(mediaMap).filter((value) => value === FALLBACK_IMAGE).length;
  console.log("");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Mapped entries: ${totalMapped}`);
  console.log(`Fallback entries remaining: ${fallbackCount}`);
  console.log(DRY_RUN ? "Dry run only. No file changes written." : `Wrote updates to ${path.basename(cardMediaPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
