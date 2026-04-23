const fs = require("fs");
const path = require("path");

const root = __dirname;
const gamesDataPath = path.join(root, "games-data.js");
const outputPath = path.join(root, "games-titles.js");

const TITLE_SMALL_WORDS = new Set([
  "a","an","and","as","at","by","for","from","in","into","of","on","or","the","to","vs","with"
]);

const TITLE_HINTS = new Set([
  "a","ace","adventure","age","air","alien","among","ancient","and","angry","animal","an","apple","arena","armor",
  "asteroids","as","attack","at","awesome","baby","backyard","bad","ball","base","baseball","basket","basketball",
  "battle","battles","bear","big","birds","bird","black","blade","blast","bleach","bloons","block","body","boss","boxing","boy",
  "brain","breakout","brick","bricks","bros","brothers","build","bullet","bullets","burger","burst","by","caliber","capitalist","captain",
  "car","cards","castle","cat","challenge","chaos","chicken","city","classic","clicker","club","combat","command",
  "conquer","contract","cookie","core","cover","craft","crash","crazy","crossing","cup","dark","date","day",
  "death","defense","deluxe","derby","dimensions","doom","door","dragon","drive","editor","escape","factor","fantasy",
  "fight","fighter","final","flip","football","force","frvr","frenzy","frog","from","fun","fury","game","gangster",
  "gangsters","garden","gba","gg","goal","golf","good","grand","great","gun","guns","hero","heroes","hit","hockey",
  "hole","hominid","house","idle","in","into","io","island","japan","journey","jump","kart","karts","king",
  "knight","knights","lab","landing","launch","legend","legends","life","lite","live","lol","madness","mama",
  "mario","master","masters","match","may","mayhem","maze","mazes","mini","minute","minutes","mission","modern",
  "monster","moon","more","moto","motor","motors","naruto","neon","nes","new","night","ninja","now","of","office",
  "on","one","orange","or","pack","panda","pandas","parkour","party","pirate","pirates","plane","planes","play",
  "player","players","pool","post","predator","pro","quest","race","racer","racers","racing","random","remaster",
  "revenge","ride","robber","rocket","room","rooms","run","runner","school","scratch","seal","secret","seconds",
  "shadow","shooter","shooting","showdown","sim","simulator","singularity","slices","small","snakes","sniper",
  "soccer","space","sports","square","stars","story","strategy","street","stunt","stunts","super","superstars",
  "survival","table","tank","tanks","taxi","td","team","tennis","the","til","time","tiny","to","tour",
  "tower","tournament","transporter","trigger","turbo","tycoon","ultimate","unblocked","unlocked","us","versus",
  "vietnam","vs","war","wars","wild","with","world","worms"
]);

const BAD_EXACT_TITLES = new Set([
  "a jam about time",
  "abandoned",
  "defaultcompany",
  "game d",
  "game :d",
  "really cool flash game",
  "unity webgl player",
  "waflash"
]);

const KNOWN_TITLE_SUFFIXES = [
  "seraph",
  "waflash",
  "unity webgl player"
];

function parseGamesData() {
  const text = fs.readFileSync(gamesDataPath, "utf8");
  return [...text.matchAll(/\{\s*"name":\s*"([^"]+)",\s*"url":\s*"([^"]+)"\s*\}/g)]
    .map(([, name, url]) => ({ name, url }));
}

function normalizeSearchText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleCaseWord(word) {
  if (!word) return "";
  const lower = word.toLowerCase();
  if (["gg", "io", "gba", "nes", "td", "frvr"].includes(lower)) return word.toUpperCase();
  if (TITLE_SMALL_WORDS.has(lower)) return lower;
  if (/^[ivxlcdm]+$/i.test(word)) return word.toUpperCase();
  if (word === word.toUpperCase() && word.length <= 5) return word;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function capitalizeFirstWord(word) {
  const formatted = titleCaseWord(word);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function splitHintedWord(word) {
  const lower = word.toLowerCase();
  if (!/^[a-z]+$/.test(lower) || lower.length < 6) return word;

  const best = Array(lower.length + 1).fill(null);
  best[0] = { score: 0, parts: [] };

  for (let end = 1; end <= lower.length; end++) {
    for (let start = Math.max(0, end - 20); start < end; start++) {
      const previous = best[start];
      if (!previous) continue;

      const part = lower.slice(start, end);
      const hinted = TITLE_HINTS.has(part);
      const score = previous.score + (hinted ? part.length * part.length : -6 - part.length);
      const candidate = { score, parts: [...previous.parts, part] };

      if (!best[end] || candidate.score > best[end].score) {
        best[end] = candidate;
      }
    }
  }

  const result = best[lower.length];
  if (!result || result.parts.length < 2) return word;

  const hintedParts = result.parts.filter((part) => TITLE_HINTS.has(part));
  if (hintedParts.length < 2) return word;
  if (result.parts.some((part) => !TITLE_HINTS.has(part) && part.length > 2)) return word;
  if (result.parts.filter((part) => part.length === 1).length > 1) return word;

  return result.parts.join(" ");
}

function formatGameTitle(name) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map(splitHintedWord)
    .join(" ")
    .split(/\s+/)
    .map((word, index) => index === 0 ? capitalizeFirstWord(word) : titleCaseWord(word))
    .join(" ");
}

function extractTitleSource(fileText) {
  const patterns = [
    /<title>([^<]+)<\/title>/i,
    /window\.gameconfig\s*=\s*\{[\s\S]*?name:\s*"([^"]+)"/i,
    /(?:^|\s)name:\s*"([^"]+)"/im,
    /property=["']og:title["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = fileText.match(pattern);
    if (match) return match[1].trim();
  }

  return "";
}

function cleanExtractedTitle(rawTitle, fallbackTitle) {
  if (!rawTitle) return "";

  let title = rawTitle
    .replace(/\s+/g, " ")
    .replace(/&amp;/gi, "&")
    .trim();

  if (title.includes(" | ")) {
    const [left, right] = title.split(" | ", 2);
    if (left && right && KNOWN_TITLE_SUFFIXES.includes(normalizeSearchText(right))) {
      title = left.trim();
    }
  }

  title = title
    .replace(/\s*\((USA|Europe|World|Rev ?\d+|Proto|Prototype|En,Fr,De,Es,It)\)\s*$/i, "")
    .replace(/\s*\(Rev ?\d+\)\s*$/i, "")
    .replace(/\s*\bROM\b\s*$/i, "")
    .trim();

  const normalized = normalizeSearchText(title);
  const normalizedFallback = normalizeSearchText(fallbackTitle);

  if (!normalized) return "";
  if (BAD_EXACT_TITLES.has(normalized)) return "";
  if (normalized.includes("unity webgl player")) return "";
  if (normalized.length <= 2 && normalized !== normalizedFallback) return "";

  return title;
}

function buildTitleMap() {
  const entries = parseGamesData();
  const titleMap = {};

  for (const entry of entries) {
    const fallbackTitle = formatGameTitle(entry.name);
    const filePath = path.join(root, entry.url.replace(/\//g, path.sep));

    let displayTitle = fallbackTitle;
    if (fs.existsSync(filePath)) {
      const fileText = fs.readFileSync(filePath, "utf8");
      const extracted = cleanExtractedTitle(extractTitleSource(fileText), fallbackTitle);
      if (extracted) {
        displayTitle = extracted;
      }
    }

    titleMap[entry.url] = displayTitle;
  }

  return titleMap;
}

const titleMap = buildTitleMap();
const sortedKeys = Object.keys(titleMap).sort((a, b) => a.localeCompare(b));
const lines = sortedKeys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(titleMap[key])}`);
const output = [
  "window.gameTitleMap = {",
  lines.join(",\n"),
  "};",
  ""
].join("\n");

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${sortedKeys.length} titles to ${path.basename(outputPath)}`);
