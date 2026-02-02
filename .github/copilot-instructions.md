# Copilot / AI Agent Instructions for UGS-Web-Hub

This repository is a static game hub (HTML/CSS/JS). Below are concise, actionable notes to help an AI agent be productive quickly.

- Summary: single-page frontend (`index.html`) that loads a canonical list (`games-data.js`) and opens static game pages from the `games/` folder.
- Hosting: deployed as a static site (GitHub Pages). The repository root contains `CNAME` for the custom domain `ugswebhub.com`.

Key files and where to look
- `index.html` — main UI and client-side rendering logic. See the `init()`, `render()` and `pickRandomTitan()` functions. [index.html](index.html#L1-L20)
- `games-data.js` — the canonical `rawGames` array used by `index.html`. Edit this file to add/remove games. [games-data.js](games-data.js#L1-L5)
- `games/` — directory of static HTML game pages. Filenames frequently use a `cl` prefix (e.g. `cl2048.html`). Ensure entries in `games-data.js` point to these files.
- `generate-sitemap.js` — small Node script that builds `sitemaps/sitemap-games.xml` from files found in `games/`. Run with `node generate-sitemap.js`. [generate-sitemap.js](generate-sitemap.js#L1-L40)
- `sitemaps/` — output for sitemap files; the script will create the folder if missing.

Project-specific conventions
- Source of truth for the library listing: `games-data.js`. The UI directly imports this file (no build step). When adding a game, always add the HTML file to `games/` and add an object to `rawGames` in `games-data.js`, e.g.:

  { "name": "MyGame", "url": "games/clmygame.html" }

- Filenames: prefer alphanumeric and hyphen/underscore. Many existing filenames include `cl` prefixes and occasional parentheses; keep consistent style when adding new files.
- Sitemap BASE_URL: `generate-sitemap.js` sets `BASE_URL` — update it if the deployment domain changes (matches `CNAME`).

Developer workflows (concrete commands)
- Preview locally: open `index.html` in a browser (no build required).
- Regenerate sitemap: `node generate-sitemap.js` (requires Node.js installed). This writes `sitemaps/sitemap-games.xml`.
- Add a new game: add `games/cl<name>.html`, add entry to `games-data.js`, optionally run sitemap generator.

Integration & external deps to be aware of
- Google AdSense snippet is in `index.html` — keep AdSense client id unchanged unless you control the account.
- `index.html` references external audio and other third-party URLs; be cautious when altering these.

Patterns & pitfalls (observed in code)
- Client-rendered search: `render()` filters `rawGames` by substring on `name` (lowercased). Avoid changing the `rawGames` schema (it must remain `{name, url}`).
- `generate-sitemap.js` enumerates files under `games/` (not `games-data.js`) — if you rely on the sitemap for discoverability, ensure both the file and the `games-data.js` entry exist.
- When removing games, remove both the HTML file and its `rawGames` entry to avoid 404s and broken UI cards.

If you need more context
- Ask for examples of recent game additions or for permission to open large `games/` files to extract metadata.

Next step for me: I can run `node generate-sitemap.js` or update/add specific game entries — tell me which you'd like.
