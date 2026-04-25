const fs = require("fs");
const path = require("path");
const https = require("https");

const DOC_EXPORT_URL = "https://docs.google.com/document/d/1W8ASn669PEq1AOfe1P_gxCCH0nz-TR-IJXPT0bWYH2g/export?format=txt";
const ROOT = path.resolve(__dirname, "..");
const GAMES_DIR = path.join(ROOT, "games");
const EXPORT_CACHE_PATH = path.join(__dirname, "ugs-doc-export.txt");
const GAMES_DATA_PATH = path.join(ROOT, "games-data.js");
const TARGET_SECTIONS = [
  { key: "html5", start: "HTML5 GAMES", end: "FLASH GAMES" },
  { key: "flash", start: "FLASH GAMES", end: "EMULATED GAMES" },
  { key: "emulated", start: "EMULATED GAMES", end: "APPS/MISC" },
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const status = response.statusCode || 0;

        if (status >= 300 && status < 400 && response.headers.location) {
          fetchText(response.headers.location).then(resolve, reject);
          response.resume();
          return;
        }

        if (status !== 200) {
          reject(new Error(`Request failed with status ${status}`));
          response.resume();
          return;
        }

        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function loadExportText() {
  return fetchText(DOC_EXPORT_URL).then((text) => {
    fs.writeFileSync(EXPORT_CACHE_PATH, text, "utf8");
    return text;
  });
}

function normalizeLine(line) {
  return line.replace(/\uFEFF/g, "").trim();
}

function buildGamesFileMap() {
  const map = new Map();
  for (const fileName of fs.readdirSync(GAMES_DIR)) {
    if (path.extname(fileName).toLowerCase() !== ".html") continue;
    map.set(fileName.toLowerCase(), fileName);
  }
  return map;
}

function sliceSection(lines, startHeading, endHeading) {
  const startIndex = lines.findIndex((line) => normalizeLine(line) === startHeading);
  if (startIndex === -1) {
    throw new Error(`Could not find section "${startHeading}" in the doc export.`);
  }

  const endIndex = lines.findIndex((line, index) => index > startIndex && normalizeLine(line) === endHeading);
  return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex);
}

function looksLikeHeading(line) {
  if (!line) return true;
  if (/^[─-]+$/.test(line)) return true;
  if (/^[A-Z0-9/& +.'’:-]+$/.test(line) && !/\.html/i.test(line)) return true;
  return false;
}

function parseGameLine(line) {
  const match = line.match(/^(.+?):\s*(.+?\.html)\b/i);
  if (!match) return null;

  const title = match[1].trim();
  let fileName = match[2].trim();

  fileName = fileName
    .replace(/\s+\(alt link\).*$/i, "")
    .replace(/\s+\(disk.*$/i, "")
    .replace(/\s+\(disc.*$/i, "")
    .trim();

  if (!fileName.toLowerCase().endsWith(".html")) return null;

  return { title, fileName };
}

function collectEntries(lines, fileMap, sectionKey) {
  const entries = [];
  const skipped = [];
  const seen = new Set();
  let activeSystem = null;

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (sectionKey === "emulated" && /^[A-Z0-9/& +.'’:-]+$/.test(line) && !/\.html/i.test(line) && !/^EMULATED GAMES$/i.test(line) && !/^EMULATOR$/i.test(line) && !/GAMES$/i.test(line)) {
      activeSystem = line;
      continue;
    }

    if (looksLikeHeading(line)) continue;

    const parsed = parseGameLine(line);
    if (!parsed) continue;

    const actualFile = fileMap.get(parsed.fileName.toLowerCase());
    if (!actualFile) {
      skipped.push({ title: parsed.title, fileName: parsed.fileName });
      continue;
    }

    const url = `games/${actualFile}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({
      name: parsed.title,
      url,
      type: sectionKey,
      system: sectionKey === "emulated" ? activeSystem : null,
    });
  }

  return { entries, skipped };
}

function writeGamesData(entries) {
  const lines = entries.map((entry) => `  ${JSON.stringify(entry)}`);
  const output = [
    "var rawGames = [",
    lines.join(",\n"),
    "];",
    "",
  ].join("\n");

  fs.writeFileSync(GAMES_DATA_PATH, output, "utf8");
}

async function main() {
  const text = await loadExportText();
  const lines = text.split(/\r?\n/);
  const fileMap = buildGamesFileMap();

  const allEntries = [];
  const allSkipped = [];

  for (const section of TARGET_SECTIONS) {
    const sectionLines = sliceSection(lines, section.start, section.end);
    const { entries, skipped } = collectEntries(sectionLines, fileMap, section.key);
    allEntries.push(...entries);
    allSkipped.push(...skipped.map((item) => ({ ...item, section: section.key })));
  }

  writeGamesData(allEntries);

  console.log(`Imported ${allEntries.length} games from the UGS doc into ${path.basename(GAMES_DATA_PATH)}.`);

  if (allSkipped.length) {
    console.log(`Skipped ${allSkipped.length} doc entries because the HTML file was not found locally:`);
    for (const item of allSkipped.slice(0, 50)) {
      console.log(`- [${item.section}] ${item.title} -> ${item.fileName}`);
    }
    if (allSkipped.length > 50) {
      console.log(`...and ${allSkipped.length - 50} more.`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
