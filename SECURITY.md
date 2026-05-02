# Security Policy

UGS Web Hub is a static GitHub Pages project, but security still matters because the site links to a large library of browser game pages and external assets.

## Supported Version

The `main` branch is the supported version of the site.

## Reporting a Vulnerability

Please report security issues privately through GitHub security advisories if available, or by contacting the repository owner directly.

Include:

- A clear description of the issue.
- Steps to reproduce it.
- The affected page or file path.
- Any browser console errors or network details that help confirm the problem.

## Security Priorities

- Avoid adding untrusted scripts unless they are necessary and reviewed.
- Keep third-party embeds and external asset URLs intentional.
- Preserve `rel="noreferrer"` on external links opened in a new tab.
- Avoid collecting user data in the frontend.
- Treat generated content as publishable site content and review scripts before running them.
