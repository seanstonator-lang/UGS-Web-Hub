const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "library");
const SITE_URL = "https://ugswebhub.com";

const GENRE_RULES = [
  { name: "racing", label: "Speed Run", blurb: "fast reaction racing and clean corner control", match: ["racing","race","racer","kart","car","cars","driver","driving","motors","moto","bike","bmx","taxi","derby","stunt","stunts"] },
  { name: "sports", label: "Game Time", blurb: "quick sports sessions built around timing and pressure", match: ["soccer","football","basket","baseball","tennis","golf","bowl","boxing","pool","ball","sports","skate"] },
  { name: "horror", label: "Night Shift", blurb: "tense atmosphere, darker themes, and pressure-first play", match: ["horror","night","dark","ghost","haunt","doom","zombie","dead","evil","blood","monster","creepy","fear","backrooms"] },
  { name: "strategy", label: "Brain Online", blurb: "planning, resource decisions, and slower tactical choices", match: ["war","wars","defense","tycoon","idle","sim","simulator","manager","command","empire","chess","checkers","card","cards"] },
  { name: "puzzle", label: "Mind Melt", blurb: "logic, pattern spotting, and careful problem solving", match: ["puzzle","maze","escape","2048","match","blocks","block","sudoku","logic","mahjong","word","color","sort"] },
  { name: "platformer", label: "Jump Tech", blurb: "movement, jumps, timing, and quick restarts", match: ["mario","platform","jump","runner","dash","parkour","tower","square","celeste","ninja","sonic"] },
  { name: "sandbox", label: "Open Build", blurb: "open-ended play, experimentation, and build-your-own chaos", match: ["craft","sandbox","world","builder","building","minecraft","city"] },
  { name: "action", label: "Adrenaline", blurb: "direct action, quick decisions, and constant pressure", match: ["shooter","shooting","combat","battle","fighter","fight","gun","guns","sniper","assassin","attack","strike","smash","alien"] },
  { name: "adventure", label: "Quest Mode", blurb: "exploration, discovery, and story-flavored progression", match: ["adventure","legend","quest","story","island","journey","zelda","pokemon","temple","cave","dragon"] },
  { name: "arcade", label: "Arcade", blurb: "short sessions, simple goals, and immediate feedback", match: [] },
];

function loadGlobals(fileName) {
  const context = { window: {} };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, fileName), "utf8"), context, { filename: fileName });
  return context;
}

const games = loadGlobals("games-data.js").rawGames || [];
const titleMap = loadGlobals("games-titles.js").window.gameTitleMap || {};
const mediaMap = loadGlobals("game-card-media.js").window.gameCardMediaMap || {};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getSlug(gameUrl) {
  return path.basename(gameUrl, ".html");
}

function getDisplayName(game) {
  return titleMap[game.url] || game.name || getSlug(game.url);
}

function getGenre(title, rawName) {
  const haystack = normalize(`${title} ${rawName}`);
  return GENRE_RULES.find(rule => rule.match.some(token => haystack.includes(token))) || GENRE_RULES[GENRE_RULES.length - 1];
}

function platformLabel(game) {
  if (game.type === "emulated" && game.system) return `${game.system} emulation`;
  if (game.type === "flash") return "Flash game";
  return "HTML5 browser game";
}

function sentenceVariant(title) {
  const seed = normalize(title);
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i) * (i + 5);
  return total % 4;
}

function getRelated(current, allGames) {
  const title = getDisplayName(current);
  const genre = getGenre(title, current.name);
  return allGames
    .filter(game => game.url !== current.url)
    .map(game => {
      const relatedTitle = getDisplayName(game);
      const relatedGenre = getGenre(relatedTitle, game.name);
      const score = (relatedGenre.name === genre.name ? 5 : 0) + (game.type === current.type ? 2 : 0);
      return { game, score, title: relatedTitle };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, undefined, { numeric: true }))
    .slice(0, 4);
}

function detailPathFor(game) {
  return `${getSlug(game.url)}.html`;
}

function detailUrlFor(game) {
  return `${SITE_URL}/library/${detailPathFor(game)}`;
}

function buildOverview(title, genre, game) {
  const platform = platformLabel(game);
  const variants = [
    `${title} is cataloged on UGS Web Hub as a ${platform} with a ${genre.label} feel. This library page adds context before the fullscreen player opens, so visitors can understand what kind of session they are choosing instead of landing on a bare launch screen.`,
    `${title} lives in the ${genre.label} lane of the UGS Web Hub library. The player is kept separate from this written entry, giving the site a readable page for browsing, comparison, and search while keeping the actual game screen focused on play.`,
    `${title} is one of the playable entries in the UGS Web Hub collection. This page explains the title, its general pacing, and the best way to approach it before sending players into the dedicated ${platform} screen.`,
    `${title} gets its own library note here so the game is not just a title in a grid. The page gives players a quick read on the ${genre.label} style, the launch path, and related picks from the wider collection.`,
  ];
  return variants[sentenceVariant(title)];
}

function buildTips(title, genre) {
  const base = [
    `Start with a short run in ${title} before chasing a perfect attempt; most browser games reward learning the rhythm first.`,
    `Use the first minute to test movement, menus, restart behavior, and any fullscreen controls before committing to a longer session.`,
    `If the game feels difficult right away, slow down and look for the repeatable pattern. The best runs usually come after one or two quick resets.`,
  ];
  const genreTip = {
    racing: "For racing games, clean turns usually beat reckless speed. Let the track teach you where to push.",
    sports: "For sports games, timing matters more than button mashing. Watch the opponent pattern before forcing a shot.",
    horror: "For tense games, sound and pacing matter. Give the page a moment to load fully before judging the atmosphere.",
    strategy: "For strategy games, early choices compound quickly. Spend the first round learning what the game rewards.",
    puzzle: "For puzzle games, avoid rushing the first obvious move. A slower opening often reveals the cleaner solution.",
    platformer: "For platformers, short jumps and controlled restarts are usually more useful than one huge attempt.",
    sandbox: "For sandbox games, test the tools first. The fun usually comes from discovering how systems interact.",
    action: "For action games, learn enemy timing before going all-in. Staying alive long enough to read the room changes everything.",
    adventure: "For adventure games, scan the scene before clicking through. Small details often point to progress.",
    arcade: "For arcade games, treat the first run as calibration. Score chasing starts after the controls click.",
  }[genre.name] || "Use the first run to learn the controls, then return for a cleaner attempt.";
  return [...base, genreTip];
}

function renderGamePage(game) {
  const title = getDisplayName(game);
  const genre = getGenre(title, game.name);
  const slug = getSlug(game.url);
  const image = mediaMap[game.url] || "../favicon.png";
  const playHref = `../${game.url}`;
  const related = getRelated(game, games);
  const description = `${title} on UGS Web Hub: a ${platformLabel(game)} in the ${genre.label} collection with notes, tips, related picks, and a direct fullscreen launch.`;
  const tips = buildTips(title, genre);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${escapeHtml(detailUrlFor(game))}">
  <title>${escapeHtml(title)} | UGS Web Hub Library</title>
  <link rel="icon" type="image/png" href="../favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Expanded:wght@700;800&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#07111f;--panel:#101d30;--panel-2:#132941;--text:#f4fbff;--muted:#a8bdd5;--line:rgba(119,168,255,.22);--primary:#5eead4;--secondary:#77a8ff;--accent:#ffd166;--shadow:0 24px 70px rgba(0,0,0,.32)}
    *{box-sizing:border-box}
    body{margin:0;color:var(--text);font-family:"Space Grotesk","Trebuchet MS",sans-serif;background:linear-gradient(145deg,#06101d 0%,#0c1828 48%,#07101b 100%)}
    a{color:inherit}
    .wrap{width:min(1160px,calc(100vw - 32px));margin:0 auto;padding:28px 0 56px}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
    .brand{font-family:"Archivo Expanded","Arial Black",sans-serif;font-size:.92rem;text-transform:uppercase;text-decoration:none;color:var(--text)}
    .nav{display:flex;flex-wrap:wrap;gap:10px}
    .nav a,.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);text-decoration:none;font-size:.78rem;font-weight:700;text-transform:uppercase}
    .hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:26px;align-items:stretch;margin-bottom:26px}
    .copy{padding:32px 0}
    .eyebrow{display:inline-flex;margin-bottom:16px;color:var(--accent);font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em}
    h1{margin:0 0 16px;font-family:"Archivo Expanded","Arial Black",sans-serif;font-size:clamp(2rem,6vw,4.8rem);line-height:1;text-transform:uppercase}
    .lead{margin:0;color:var(--muted);font-size:1.05rem;line-height:1.75}
    .heroMedia{min-height:320px;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)}
    .heroMedia img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.05) contrast(1.04)}
    .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
    .button.primary{border:0;background:linear-gradient(135deg,var(--secondary),var(--primary));color:#04101d}
    .grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,360px);gap:22px;align-items:start}
    article,.side{display:grid;gap:16px}
    section,.sideBlock{border:1px solid var(--line);border-radius:8px;background:rgba(16,29,48,.78);padding:22px}
    h2{margin:0 0 10px;color:var(--secondary);font-size:1rem;text-transform:uppercase;letter-spacing:.08em}
    p,li{color:var(--muted);line-height:1.75}
    p{margin:0}
    ul{margin:0;padding-left:20px}
    .fact{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);color:var(--muted)}
    .fact:last-child{border-bottom:0}
    .fact strong{color:var(--text);text-align:right}
    .related{display:grid;gap:10px}
    .related a{padding:13px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:var(--text);font-weight:700}
    footer{margin-top:34px;padding-top:22px;border-top:1px solid var(--line);color:var(--muted);line-height:1.6}
    @media (max-width:860px){.hero,.grid{grid-template-columns:1fr}.copy{padding:10px 0}.heroMedia{min-height:240px}.topbar{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="topbar">
      <a class="brand" href="../index.html">UGS Web Hub</a>
      <nav class="nav" aria-label="Site navigation">
        <a href="../index.html">Hub</a>
        <a href="../guides.html">Guides</a>
        <a href="../collections.html">Collections</a>
        <a href="../about.html">About</a>
      </nav>
    </div>
    <header class="hero">
      <div class="copy">
        <span class="eyebrow">${escapeHtml(genre.label)} / ${escapeHtml(platformLabel(game))}</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(buildOverview(title, genre, game))}</p>
        <div class="actions">
          <a class="button primary" href="${escapeHtml(playHref)}" rel="nofollow">Play ${escapeHtml(title)}</a>
          <a class="button" href="../index.html#hub">Browse Library</a>
        </div>
      </div>
      <div class="heroMedia">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)} preview art" loading="eager" referrerpolicy="no-referrer">
      </div>
    </header>
    <div class="grid">
      <article>
        <section>
          <h2>What To Expect</h2>
          <p>${escapeHtml(title)} is best approached as ${escapeHtml(genre.blurb)}. The UGS Web Hub version keeps the launch page separate from the fullscreen player, which helps the library stay readable while the game itself stays focused once opened.</p>
        </section>
        <section>
          <h2>Playing Notes</h2>
          <ul>
            ${tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join("\n            ")}
          </ul>
        </section>
        <section>
          <h2>Why It Belongs Here</h2>
          <p>The hub is built for fast discovery, but ${escapeHtml(title)} deserves more than a bare link. This page gives the title a stable library entry with category context, related picks, and a direct route to the player without placing advertising on the actual game screen.</p>
        </section>
      </article>
      <aside class="side" aria-label="${escapeHtml(title)} details">
        <div class="sideBlock">
          <h2>Game Details</h2>
          <div class="fact"><span>Library lane</span><strong>${escapeHtml(genre.label)}</strong></div>
          <div class="fact"><span>Format</span><strong>${escapeHtml(platformLabel(game))}</strong></div>
          ${game.system ? `<div class="fact"><span>System</span><strong>${escapeHtml(game.system)}</strong></div>` : ""}
          <div class="fact"><span>Player page</span><strong>No ads</strong></div>
        </div>
        <div class="sideBlock">
          <h2>Related Picks</h2>
          <div class="related">
            ${related.map(item => `<a href="${escapeHtml(detailPathFor(item.game))}">${escapeHtml(item.title)}</a>`).join("\n            ")}
          </div>
        </div>
      </aside>
    </div>
    <footer>
      UGS Web Hub keeps written library pages separate from fullscreen player screens so browsing, search, and gameplay each have a clear job.
    </footer>
  </main>
</body>
</html>
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let written = 0;
for (const game of games) {
  if (!game || !game.url) continue;
  fs.writeFileSync(path.join(OUT_DIR, detailPathFor(game)), renderGamePage(game));
  written += 1;
}

console.log(`Generated ${written} game detail pages in ${path.relative(ROOT, OUT_DIR)}`);
