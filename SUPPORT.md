# Support

Use the site contact page or GitHub issues to report problems with UGS Web Hub.

## Good Bug Reports Include

- The page where the problem happened.
- The game title or link, if a game is involved.
- What you expected to happen.
- What actually happened.
- Browser and device details when layout, launch, or playback is affected.

## Common Requests

- Broken game link: include the game title and page URL.
- Bad title or card media: include the title shown and what it should be.
- Search or filter issue: include the search query and selected filters.
- Content page issue: include the page path and the incorrect section.

## Local Verification

For maintainers, run:

```bash
npm run test:e2e
```

This checks the main hub, static pages, library page flow, favorites, recently played, and 404 behavior.
