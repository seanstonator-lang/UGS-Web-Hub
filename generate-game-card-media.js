const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const gamesDataPath = path.join(root, "games-data.js");
const outputPath = path.join(root, "game-card-media.js");

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|avif|ico)(\?|#|$)/i;
const SOURCE_PATTERNS = [
  { pattern: /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi, bonus: 300 },
  { pattern: /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi, bonus: 280 },
  { pattern: /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/gi, bonus: 260 },
  { pattern: /<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["']/gi, bonus: 160 },
  { pattern: /<img[^>]+src=["']([^"']+)["']/gi, bonus: 170 },
  { pattern: /poster=["']([^"']+)["']/gi, bonus: 220 },
  { pattern: /background-image\s*:\s*url\((['"]?)([^)'"]+)\1\)/gi, bonus: 190, group: 2 },
];

const POSITIVE_HINTS = [
  ["cover", 120],
  ["background", 110],
  ["presplash", 120],
  ["splash", 115],
  ["loading", 90],
  ["thumbnail", 100],
  ["thumb", 95],
  ["logo", 55],
  ["hero", 100],
  ["banner", 95],
  ["screen", 80],
  ["shot", 80],
  ["icon-512", 90],
  ["icon-384", 80],
  ["icon-256", 70],
  ["icon-192", 65],
  ["appicon", 75],
  ["templatedata", 25],
];

const NEGATIVE_HINTS = [
  ["favicon", -300],
  ["apple-touch-icon", -110],
  ["discordlogo", -160],
  ["settings", -140],
  ["stats", -140],
  ["updatelog", -140],
  ["loading.gif", -100],
  ["torch", -110],
  ["door", -90],
  ["spider", -120],
  ["cursor", -180],
  ["gamemonetize-logo", -260],
  ["button", -120],
  ["controls", -100],
  ["hand", -100],
  ["star", -80],
];

const BLOCKED_MEDIA_SNIPPETS = [
  "LargeCursorPointer50Percent.png",
  "gamemonetize-logo.png",
];

function parseGamesData() {
  const text = fs.readFileSync(gamesDataPath, "utf8");
  const sandbox = {};
  vm.runInNewContext(text, sandbox);
  return Array.isArray(sandbox.rawGames) ? sandbox.rawGames : [];
}

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/&amp;/gi, "&").trim();
}

function getBaseHref(html) {
  const match = html.match(/<base[^>]+href=["']([^"']+)["']/i);
  return match ? normalizeUrl(match[1]) : "";
}

function scoreCandidate(url, bonus) {
  const lower = url.toLowerCase();
  let score = bonus;

  for (const [hint, value] of POSITIVE_HINTS) {
    if (lower.includes(hint)) score += value;
  }
  for (const [hint, value] of NEGATIVE_HINTS) {
    if (lower.includes(hint)) score += value;
  }

  if (/\.png(\?|#|$)/i.test(url)) score += 18;
  if (/\.jpe?g(\?|#|$)/i.test(url)) score += 10;
  if (/\.webp(\?|#|$)/i.test(url)) score += 12;
  if (/^https?:/i.test(url)) score += 8;
  if (/^data:/i.test(url)) score -= 400;

  return score;
}

function resolveAssetUrl(ref, gameFile, baseHref) {
  const clean = normalizeUrl(ref).split("#")[0];
  if (!clean || clean.startsWith("data:")) return null;
  if (/\s/.test(clean)) return null;
  if (!IMAGE_EXTENSIONS.test(clean)) return null;

  if (/^https?:/i.test(clean)) {
    return BLOCKED_MEDIA_SNIPPETS.some(snippet => clean.includes(snippet)) ? null : clean;
  }

  if (clean.startsWith("//")) {
    return `https:${clean}`;
  }

  if (baseHref) {
    try {
      const resolved = new URL(clean, baseHref).toString();
      return BLOCKED_MEDIA_SNIPPETS.some(snippet => resolved.includes(snippet)) ? null : resolved;
    } catch (error) {
      return null;
    }
  }

  if (clean.startsWith("/")) {
    const localAbsolute = path.join(root, clean.replace(/^\/+/, "").replace(/\//g, path.sep));
    if (fs.existsSync(localAbsolute)) {
      const resolved = clean.replace(/^\/+/, "");
      return BLOCKED_MEDIA_SNIPPETS.some(snippet => resolved.includes(snippet)) ? null : resolved;
    }
    return null;
  }

  const localAbsolute = path.resolve(path.dirname(gameFile), clean.replace(/\//g, path.sep));
  if (!localAbsolute.startsWith(root)) return null;
  if (!fs.existsSync(localAbsolute)) return null;

  const resolved = path.relative(root, localAbsolute).replace(/\\/g, "/");
  return BLOCKED_MEDIA_SNIPPETS.some(snippet => resolved.includes(snippet)) ? null : resolved;
}

function extractCandidates(html) {
  const candidates = [];

  for (const source of SOURCE_PATTERNS) {
    const group = source.group || 1;
    for (const match of html.matchAll(source.pattern)) {
      const raw = normalizeUrl(match[group]);
      if (!raw || !IMAGE_EXTENSIONS.test(raw)) continue;
      candidates.push({ raw, bonus: source.bonus });
    }
  }

  return candidates;
}

function pickBestAsset(game) {
  const gameFile = path.join(root, game.url);
  if (!fs.existsSync(gameFile)) return null;

  const html = fs.readFileSync(gameFile, "utf8");
  const baseHref = getBaseHref(html);
  const candidates = extractCandidates(html);

  let best = null;

  for (const candidate of candidates) {
    const resolved = resolveAssetUrl(candidate.raw, gameFile, baseHref);
    if (!resolved) continue;

    const score = scoreCandidate(resolved, candidate.bonus);
    if (!best || score > best.score) {
      best = { src: resolved, score };
    }
  }

  if (!best || best.score < 150) {
    return null;
  }

  return best.src;
}

function buildMediaMap() {
  const games = parseGamesData();
  const mediaMap = {};
  const fallbackImage = "favicon.png";

  for (const game of games) {
    const asset = pickBestAsset(game);
    mediaMap[game.url] = asset || fallbackImage;
  }

  return mediaMap;
}

const mediaMap = buildMediaMap();
const sortedKeys = Object.keys(mediaMap).sort((a, b) => a.localeCompare(b));
const lines = sortedKeys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(mediaMap[key])}`);
const output = [
  "window.gameCardMediaMap = {",
  lines.join(",\n"),
  "};",
  ""
].join("\n");

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${sortedKeys.length} card media entries to ${path.basename(outputPath)}`);
