const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const BASE_URL = "https://ugswebhub.com";
const LIBRARY_DIR = path.join(ROOT, "library");
const SITEMAPS_DIR = path.join(ROOT, "sitemaps");

const corePages = [
  "",
  "about.html",
  "contact.html",
  "privacy.html",
  "guides.html",
  "collections.html",
  "advertising.html",
];

function getLibraryPages() {
  if (!fs.existsSync(LIBRARY_DIR)) return [];
  return fs.readdirSync(LIBRARY_DIR)
    .filter(file => file.endsWith(".html"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(file => `library/${file}`);
}

function renderUrl(pathName, priority) {
  const loc = pathName ? `${BASE_URL}/${pathName}` : `${BASE_URL}/`;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    "    <changefreq>weekly</changefreq>",
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function renderSitemap(paths) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.join("\n\n") +
    `\n</urlset>\n`;
}

fs.mkdirSync(SITEMAPS_DIR, { recursive: true });

const coreUrls = corePages.map(page => renderUrl(page, page ? "0.8" : "1.0"));
const libraryUrls = getLibraryPages().map(page => renderUrl(page, "0.7"));

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap([...coreUrls, ...libraryUrls]));
fs.writeFileSync(path.join(SITEMAPS_DIR, "sitemap-library.xml"), renderSitemap(libraryUrls));

console.log(`Sitemap generated with ${coreUrls.length + libraryUrls.length} URLs`);
