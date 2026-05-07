const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HTML_SOURCES = [
  ...fs.readdirSync(ROOT)
    .filter(file => file.endsWith(".html"))
    .map(file => path.join(ROOT, file)),
  ...listHtml(path.join(ROOT, "library")),
];

const ATTRIBUTE_RE = /\b(?:href|src)=["']([^"']+)["']/gi;
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

const brokenLinks = [];

for (const filePath of HTML_SOURCES) {
  const html = fs.readFileSync(filePath, "utf8");
  let match;
  while ((match = ATTRIBUTE_RE.exec(html))) {
    const target = match[1].trim();
    if (shouldSkip(target)) continue;

    const resolved = resolveLocalTarget(filePath, target);
    if (!resolved || existsAsFileOrIndex(resolved)) continue;

    brokenLinks.push({
      file: path.relative(ROOT, filePath),
      target,
      resolved: path.relative(ROOT, resolved),
    });
  }
}

if (brokenLinks.length) {
  console.error("Broken local links found:");
  for (const link of brokenLinks.slice(0, 50)) {
    console.error(`- ${link.file} -> ${link.target} (${link.resolved})`);
  }
  if (brokenLinks.length > 50) {
    console.error(`...and ${brokenLinks.length - 50} more`);
  }
  process.exit(1);
}

console.log(`Local link check passed for ${HTML_SOURCES.length} HTML files.`);

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listHtml(fullPath);
      return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
    });
}

function shouldSkip(target) {
  return !target ||
    target.startsWith("#") ||
    target.includes("${") ||
    EXTERNAL_RE.test(target);
}

function resolveLocalTarget(sourceFile, target) {
  const withoutHash = target.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  if (!withoutQuery) return null;

  const decoded = decodeURIComponent(withoutQuery);
  if (decoded.startsWith("/")) {
    return path.join(ROOT, decoded.slice(1));
  }
  return path.resolve(path.dirname(sourceFile), decoded);
}

function existsAsFileOrIndex(targetPath) {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) return true;
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    return fs.existsSync(path.join(targetPath, "index.html"));
  }
  return false;
}
