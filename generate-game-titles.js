const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const gamesDataPath = path.join(root, "games-data.js");
const outputPath = path.join(root, "games-titles.js");
const overridesPath = path.join(root, "scripts", "game-title-overrides.json");

const TITLE_REPLACEMENTS = [
  [/&amp;/gi, "&"],
  [/&quot;/gi, '"'],
  [/&#39;|&apos;/gi, "'"],
  [/&nbsp;/gi, " "],
  [/â€™|’|‘/g, "'"],
  [/â€œ|â€|“|”/g, '"'],
  [/â€“|â€”|–|—/g, "-"],
  [/â€¦|…/g, "..."],
  [/Â/g, ""],
];

function parseGamesData() {
  const text = fs.readFileSync(gamesDataPath, "utf8");
  const sandbox = {};
  vm.runInNewContext(text, sandbox);
  return Array.isArray(sandbox.rawGames) ? sandbox.rawGames : [];
}

function loadOverrides() {
  if (!fs.existsSync(overridesPath)) {
    return {};
  }

  const raw = fs.readFileSync(overridesPath, "utf8");
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function normalizeTitle(value) {
  if (typeof value !== "string") return "";

  let title = value.normalize("NFKC");
  for (const [pattern, replacement] of TITLE_REPLACEMENTS) {
    title = title.replace(pattern, replacement);
  }

  return title
    .replace(/\s+/g, " ")
    .replace(/\s+([:;!?.,])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function buildTitleMap() {
  const entries = parseGamesData();
  const overrides = loadOverrides();
  const titleMap = {};

  for (const entry of entries) {
    const exactTitle = normalizeTitle(overrides[entry.url] || entry.name);
    if (!exactTitle) continue;
    titleMap[entry.url] = exactTitle;
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
console.log(`Wrote ${sortedKeys.length} exact titles to ${path.basename(outputPath)}`);
