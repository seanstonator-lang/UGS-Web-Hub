# Contributing

Thanks for helping improve UGS Web Hub. This project moves fastest when changes stay focused, tested, and easy to review.

## Local Setup

Install dependencies:

```bash
npm ci
```

Run the end-to-end suite:

```bash
npm run test:e2e
```

## Change Guidelines

- Keep edits scoped to the feature, fix, or content pass you are working on.
- Avoid hand-editing generated `library/` pages unless the generator cannot support the needed change.
- Prefer updating source data or generation scripts when many generated pages need the same change.
- Run Playwright before opening a pull request if the change affects hub navigation, filters, launch flows, static pages, or generated library pages.
- Do not commit `playwright-report/`, `test-results/`, `node_modules/`, or local export files.

## Generated Content

The project uses scripts to keep the large game catalog maintainable:

- `npm run build:game-pages` regenerates `library/` detail pages.
- `npm run build:sitemap` regenerates sitemap files.
- `npm run build:content` regenerates both library pages and sitemaps.
- `npm run build:card-media` refreshes card media metadata.

When a generated output changes, include the script or source-data change that caused it.

## Pull Request Checklist

- The change has a clear title and short summary.
- Tests were run locally when relevant.
- Generated files were updated only when needed.
- User-facing copy is spelled correctly and matches the tone of the site.
- Links are relative where possible and work on GitHub Pages.
