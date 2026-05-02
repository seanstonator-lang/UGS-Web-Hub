# UGS Web Hub

[![Playwright Tests](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml/badge.svg)](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml)

UGS Web Hub is a personal project built to turn the Ultimate Game Stash into a fast, searchable, and polished web hub.

Live site: [ugswebhub.com](https://ugswebhub.com)

## Current Features

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
- [Release checklist](docs/RELEASE_CHECKLIST.md)
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
