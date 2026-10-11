const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const site = 'https://gn-math.dev';
const skipIds = new Set([-1, 87, 253, 849]); // Link and tools, not games.

async function main() {
  const pageResponse = await fetch(site);
  if (!pageResponse.ok) throw new Error(`GN Math homepage returned ${pageResponse.status}`);
  const page = await pageResponse.text();
  const setting = name => {
    const match = page.match(new RegExp(`(?:let|const) ${name} = "([^"]+)"`));
    if (!match) throw new Error(`Could not find ${name} on GN Math`);
    return new URL(match[1], site).href;
  };
  const zonesUrl = setting('zonesURL');
  const coverUrl = setting('coverURL');
  const htmlUrl = setting('htmlURL');
  const response = await fetch(zonesUrl);
  if (!response.ok) throw new Error(`GN Math game list returned ${response.status}`);
  const zones = await response.json();
  if (!Array.isArray(zones) || zones.length < 100) throw new Error('Unexpected GN Math game list');

  const games = zones.filter(zone => {
    return Number.isInteger(zone.id) && !skipIds.has(zone.id) &&
      typeof zone.name === 'string' && typeof zone.url === 'string' &&
      zone.url.startsWith('{HTML_URL}/');
  }).map(zone => {
    const gameUrl = new URL(zone.url.replace('{HTML_URL}', htmlUrl.replace(/\/$/, '')), site);
    const cover = typeof zone.cover === 'string'
      ? new URL(zone.cover.replace('{COVER_URL}', coverUrl.replace(/\/$/, '')), site)
      : null;
    if (gameUrl.hostname !== 'gn-math.dev' || gameUrl.protocol !== 'https:') {
      throw new Error(`Unexpected game URL for ${zone.name}`);
    }
    const name = zone.name.replace(/[\u0000-\u001f<>]/g, '').trim();
    return {
      name,
      url: gameUrl.href,
      type: 'html5',
      source: 'gnmath',
      ...(cover?.hostname === 'gn-math.dev' ? { cardMedia: cover.href } : {}),
    };
  });
  const output = `// Generated from ${site}/ by scripts/import-gnmath-games.cjs.\nwindow.gnMathGames = ${JSON.stringify(games, null, 2)};\n`;
  fs.writeFileSync(path.join(root, 'gnmath-games.js'), output);
  console.log(`Imported ${games.length} GN Math game entries`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
