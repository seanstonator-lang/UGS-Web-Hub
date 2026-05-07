# GitHub Ruleset

The repository keeps a recommended branch ruleset template at `.github/rulesets/main-branch-protection.json`.

GitHub rulesets are repository settings, not automatically applied just because a JSON file exists in the repo. This file is here so the intended protection is versioned, reviewable, and easy to recreate.

## Recommended Main Rules

- Protect the default branch.
- Block branch deletion.
- Block force pushes.
- Require linear history.
- Require pull requests before updates to `main`.
- Require the `e2e` status check from the Playwright workflow.
- Require branch checks to be up to date before merge.

## Applying In GitHub

Use GitHub repository settings:

1. Open `Settings`.
2. Open `Rules`.
3. Create a branch ruleset.
4. Match the default branch.
5. Mirror the rules in `.github/rulesets/main-branch-protection.json`.
6. Confirm the required status check is `e2e`.

The template uses zero required reviewers so a solo maintainer can still move quickly through pull requests while forcing checks to pass before `main` changes.

## Why This Exists

This project has generated files, a large static catalog, and many launch paths. The ruleset keeps direct `main` changes from bypassing CI while still preserving a fast solo-maintainer workflow.
