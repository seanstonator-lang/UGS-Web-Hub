# UGS Web Hub

[![Playwright Tests](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml/badge.svg)](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml)

UGS Web Hub is a personal project built to turn the Ultimate Game Stash into a fast, searchable, and polished web hub.

Live site: [ugswebhub.com](https://ugswebhub.com)

DogeUB service: [ugs-dogeub.onrender.com](https://ugs-dogeub.onrender.com)

## Current Features

### Open from one file

Double-click `UGS-Web-Hub.html` to open the full hub in your browser. You can copy
that file anywhere; no install, server, or accompanying folder is needed. Search,
filters, themes, favorites, and recent games run locally. Browser storage must be
available to remember favorites across visits.

Games download from the same jsDelivr UGS Files source used by the older
`clSINGLEFILE.html` launcher, then open in a new tab. Internet access and access
to that CDN are required. Supporting pages and DogeUB still use their own sites.
This is a portable hub, not an offline archive of every game or a bundled proxy server.

Rebuild it after hub/catalog changes with `npm run build:singlefile-hub`.
The older `ugs-singlefile-launcher.html` is a separate launcher for a local games folder.

For an internet-free local version, open `UGS-Web-Hub-Offline.html`. It includes
29 games and does not load game files from the site. The file is about 53 MB;
copy that one file to the Chromebook. Rebuild it with `npm run build:offline-hub`
while online to cache the source game scripts. A Chromebook administrator can
also restrict opening local HTML files; this project cannot override that setting.

- Fast searchable game catalog with genre, platform, and system filters
- Quick-start collections for different play moods
- Favorites and recently played lists saved in the browser
- Spotlight, random pick, favorite surprise, and same-tab launch flows
- Generated library detail pages with publisher-friendly content before launch
- Card media enrichment pipeline for stronger visual browsing
- Support and content pages: about, guides, collections, standards, privacy, contact, and 404
- Sitemap generation for the hub, static pages, and library pages
- Playwright end-to-end tests running locally and in GitHub Actions

## Project Layout

- `index.html` is the main hub experience.
- `games/` contains the playable game pages.
- `library/` contains generated game detail pages.
- `card-media/` stores generated and enriched card artwork.
- `scripts/` contains import, media enrichment, and content generation tools.
- `tests/` contains Playwright coverage for hub, library, and static-page flows.

## Maintainer Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Operations](docs/OPERATIONS.md)
- [DogeUB deployment](docs/DOGEUB_DEPLOYMENT.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [GitHub ruleset](docs/GITHUB_RULESET.md)
- [Repository settings](docs/REPO_SETTINGS.md)
- [Contributing](CONTRIBUTING.md)
- [Support](SUPPORT.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Stack

- HTML, CSS, and vanilla JavaScript
- GitHub Pages for hosting
- Playwright for end-to-end testing
- GitHub Actions for automatic test runs on pushes and pull requests

## Useful Commands

Install dependencies:

```bash
npm ci
```

Run the end-to-end suite:

```bash
npm run test:e2e
```

Run local link, sitemap, and browser checks:

```bash
npm run check
```

Run Playwright with a visible browser:

```bash
npm run test:e2e:headed
```

Regenerate library pages and sitemaps:

```bash
npm run build:content
```

Regenerate card media data:

```bash
npm run build:card-media
```

## Project Goal

Keep the Ultimate Game Stash easy to browse, safe to update, and strong enough to scale as the library grows.
