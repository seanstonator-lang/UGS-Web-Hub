# Operations

This file is the quick maintainer playbook for common UGS Web Hub work.

## Before Editing

```bash
git status --short --branch
npm ci
```

## Standard Verification

```bash
npm run test:e2e
```

Use this before pushing changes to hub behavior, static navigation, generated library pages, or launch routing.

## Updating Catalog Content

If the source game catalog changes:

```bash
npm run import:ugs-doc
npm run build:content
```

Review changes carefully because this can update many generated files.

## Updating Library Detail Pages

```bash
npm run build:game-pages
npm run build:sitemap
```

Use this after changing `scripts/build-game-detail-pages.cjs`, title data, media data, or sitemap logic.

## Updating Card Media

```bash
npm run build:card-media
```

For local dry runs:

```bash
npm run build:card-media:local:dry
```

## CI

GitHub Actions runs Playwright on pushes to `main` and on pull requests. Failed runs upload a Playwright report artifact.
