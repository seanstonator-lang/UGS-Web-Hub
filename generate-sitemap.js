const fs = require("fs");
const path = require("path");

const GAMES_DIR = "./games"; // folder with your HTML files
const BASE_URL = "https://ugswebhub.com/games/";
const OUTPUT = "./sitemaps/sitemap-games.xml"; // output path

// Make sure the /sitemaps folder exists
if (!fs.existsSync("./sitemaps")) {
  fs.mkdirSync("./sitemaps");
}

const files = fs.readdirSync(GAMES_DIR).filter(f => f.endsWith(".html"));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n`;

files.forEach(file => {
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}${file}</loc>\n`;
  xml += `  </url>\n\n`;
});

xml += `</urlset>`;

fs.writeFileSync(OUTPUT, xml);

console.log(`✅ Sitemap generated: ${OUTPUT}`);
