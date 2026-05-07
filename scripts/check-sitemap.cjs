const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://ugswebhub.com";
const MAIN_SITEMAP = path.join(ROOT, "sitemap.xml");
const LIBRARY_SITEMAP = path.join(ROOT, "sitemaps", "sitemap-library.xml");

const mainUrls = readSitemap(MAIN_SITEMAP);
const libraryUrls = readSitemap(LIBRARY_SITEMAP);
const expectedLibraryUrls = fs.readdirSync(path.join(ROOT, "library"))
  .filter(file => file.endsWith(".html"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(file => `${BASE_URL}/library/${file}`);

const errors = [];

validateUrlSet("sitemap.xml", mainUrls);
validateUrlSet("sitemap-library.xml", libraryUrls);
expectNoDuplicates("sitemap.xml", mainUrls);
expectNoDuplicates("sitemap-library.xml", libraryUrls);

for (const url of mainUrls) {
  if (!localPageExists(url)) {
    errors.push(`sitemap.xml points to a missing local page: ${url}`);
  }
}

const missingFromMain = expectedLibraryUrls.filter(url => !mainUrls.includes(url));
const missingFromLibrary = expectedLibraryUrls.filter(url => !libraryUrls.includes(url));
const extraInLibrary = libraryUrls.filter(url => !expectedLibraryUrls.includes(url));

if (missingFromMain.length) {
  errors.push(`sitemap.xml is missing ${missingFromMain.length} library pages.`);
}
if (missingFromLibrary.length) {
  errors.push(`sitemap-library.xml is missing ${missingFromLibrary.length} library pages.`);
}
if (extraInLibrary.length) {
  errors.push(`sitemap-library.xml has ${extraInLibrary.length} entries that are not library HTML files.`);
}

if (errors.length) {
  console.error("Sitemap check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Sitemap check passed with ${mainUrls.length} main URLs and ${libraryUrls.length} library URLs.`);

function readSitemap(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}

function validateUrlSet(name, urls) {
  if (!urls.length) {
    errors.push(`${name} does not contain any <loc> entries.`);
  }
  for (const url of urls) {
    if (!url.startsWith(`${BASE_URL}/`) && url !== `${BASE_URL}/`) {
      errors.push(`${name} has an unexpected host: ${url}`);
    }
  }
}

function expectNoDuplicates(name, urls) {
  const seen = new Set();
  for (const url of urls) {
    if (seen.has(url)) errors.push(`${name} has a duplicate entry: ${url}`);
    seen.add(url);
  }
}

function localPageExists(url) {
  const relative = url === `${BASE_URL}/`
    ? "index.html"
    : url.replace(`${BASE_URL}/`, "");
  return fs.existsSync(path.join(ROOT, relative));
}
