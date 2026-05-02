# Release Checklist

Use this before pushing a meaningful site update.

## Preflight

- Check `git status --short --branch`.
- Make sure the change scope is clear.
- Avoid mixing generated catalog churn with unrelated UI or docs edits.

## Build

- Run `npm ci` if dependencies may have changed.
- Run `npm run build:content` if library pages or sitemaps need regeneration.
- Run `npm run build:card-media` if card media data changed.

## Test

```bash
npm run test:e2e
```

Confirm the suite passes before pushing.

## Review

- Scan changed files with `git diff --stat`.
- Check generated file counts if a generator ran.
- Confirm footer links and hub launch paths still route correctly.
- Confirm `README.md` or docs are updated when workflow, scripts, or site behavior changes.

## Publish

Push to `main` and watch the Playwright GitHub Action.
