# UGS Web Hub

[![Playwright Tests](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml/badge.svg)](https://github.com/seanstonator-lang/UGS-Web-Hub/actions/workflows/playwright.yml)

UGS Web Hub is a fast, browser-based game portal built to organize and launch a massive library of web games from one clean hub.

## What It Is

This repo powers the Ultimate Game Stash front end, including:

- a landing page and searchable game hub
- genre filtering and theme switching
- direct launch links into individual game pages
- privacy and contact support pages
- Playwright end-to-end coverage for the main user flows

## Stack

- HTML, CSS, and vanilla JavaScript
- GitHub Pages for hosting
- Playwright for end-to-end testing
- GitHub Actions for automatic test runs on pushes and pull requests

## Local Testing

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

## Project Goal

Keep the library fast to browse, easy to maintain, and safe to update without breaking the main hub experience.
