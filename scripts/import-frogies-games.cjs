const fs = require('node:fs');
const path = require('node:path');

const origin = 'https://frogiesarcade.net';
const output = path.resolve(__dirname, '..', 'frogies-games.js');

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || '';
}

function parseGame(tag) {
  const name = attribute(tag, 'alt').replace(/[<>&"']/g, '').trim();
  const imagePath = attribute(tag, 'src');
  const click = attribute(tag, 'onclick');
  if (!name || !imagePath.startsWith('/stuff/games/')) return null;

  let gamePath;
  const cloud = click.match(/^launch\('([^']+)'\);?$/);
  const location = click.match(/^window\.location\.href='([^']+)';?$/);
  const popup = click.match(/^window\.open\('([^']+)'\);?$/);
  if (cloud) gamePath = `/algebra.html?url=https://nowgg.fun${cloud[1]}`;
  else if (location) gamePath = location[1];
  else if (popup) gamePath = popup[1];
  if (!gamePath?.startsWith('/')) return null;

  const url = new URL(gamePath, origin);
  const cardMedia = new URL(imagePath, origin);
  if (url.origin !== origin || cardMedia.origin !== origin) return null;
  return { name, url: url.href, type: 'html5', source: 'frogies', cardMedia: cardMedia.href };
}

async function main() {
  const response = await fetch(`${origin}/math/`);
  if (!response.ok) throw new Error(`Frogie's Arcade returned HTTP ${response.status}`);
  const html = await response.text();
  const tags = [...html.matchAll(/<img\b[^>]*class="\.gamebtns"[^>]*>/gi)].map(match => match[0]);
  const games = tags.map(parseGame);
  if (games.some(game => !game)) throw new Error('A Frogie game could not be parsed');
  if (games.length < 200) throw new Error(`Only ${games.length} games found; source layout may have changed`);
  if (new Set(games.map(game => game.url)).size !== games.length) throw new Error('Duplicate Frogie launch URLs');
  const data = JSON.stringify(games, null, 2).replace(/</g, '\\u003c');
  fs.writeFileSync(output, `// Generated from ${origin}/math/ by scripts/import-frogies-games.cjs.\nwindow.frogiesGames = ${data};\n`);
  console.log(`Imported ${games.length} Frogie's Arcade games`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
