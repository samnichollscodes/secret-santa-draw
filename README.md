# Secret Santa

A festive Secret Santa draw that keeps the surprise for everyone, including whoever organises it.

**Live:** https://secret-santa-draw.samnicholls.dev

The organiser adds everyone's names, presses one button, and gets a private link for each person.
Each person opens their own link and unwraps an animated present to find out who they're buying
for. Nobody else sees it, and the organiser never does either, so they can take part too.

There's no server, account or database. The whole app is a static site.

## Features

- **Private links:** each person's link holds only their own result, so nobody sees the full list
  of who drew whom. The organiser doesn't either.
- **Households:** join people with `+` (e.g. `Sam + Alex`) so couples or housemates never draw each
  other. If a household is too big for a valid draw, the app explains why and how many more people
  are needed.
- **A fair draw:** everyone gives one present and gets one. Nobody draws themselves, and no two
  people simply swap. The draw is one big loop through the whole group.
- **Sent tracking:** copying or sharing a link ticks it off, so you can see who still needs theirs.
  You can also tick links off by hand. Starting over warns you, by name, if links have already
  gone out.
- **A present to unwrap:** the gift shakes, the lid flies off, confetti bursts out, and the name
  rises out of the box. It works by keyboard and screen reader too, and respects the "reduce
  motion" setting.
- **An optional message** for everyone, such as the budget or the date, shown on every reveal.
- **Works in in-app browsers:** links often get opened inside WhatsApp or Instagram, which can
  block normal pop-ups and copying. The app uses its own on-page dialogs and shows links to copy by
  hand when needed.

## How to run a draw

1. Open the site and add everyone's names, separated by commas. Join people who shouldn't draw
   each other with `+`.
2. Optionally add a message for everyone, such as "£25 limit, swap on Christmas Eve!".
3. Press **Draw names**. You get one link per person.
4. Send each person their link with **Copy link** or **Share**. **Don't open other people's
   links**, because that would show you who they drew.
5. Each person opens their link and taps the present to see who they're buying for.

Your draw is saved in your browser, so you can close the tab and come back to it. Do the draw on
the live site, not on `localhost`: links point at whichever address you drew on.

### How private is it?

Each link contains that person's result, scrambled so it can't be read at a glance. It's
**scrambled, not encrypted**: someone determined could decode a link they were given. That's fine
among family and friends, but the app isn't designed to keep secrets from someone actively trying
to cheat. Keeping it truly secret would need a server to hold the results.

## Tech stack

| Area                               | Tools                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App                                | [React 19](https://react.dev) and [TypeScript 7](https://www.typescriptlang.org) in strict mode                                                                 |
| Build and dev server               | [Vite 8](https://vite.dev)                                                                                                                                      |
| Styling                            | Plain CSS with custom properties. Fonts from Google Fonts (Playfair Display, Great Vibes, Lato)                                                                 |
| Linting and formatting             | [Biome 2](https://biomejs.dev), plus [oxlint](https://oxc.rs)                                                                                                   |
| Unit tests                         | [Vitest 5](https://vitest.dev)                                                                                                                                  |
| End-to-end and accessibility tests | [Playwright](https://playwright.dev) and [axe-core](https://github.com/dequelabs/axe-core), checking WCAG 2.2 AA on desktop and mobile                          |
| Hosting                            | [Cloudflare Workers](https://developers.cloudflare.com/workers/) (static assets), deployed with [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |

## Getting set up

### What you need

- [Node.js](https://nodejs.org) **22.12 or newer** (Vite needs at least 20.19 or 22.12)
- npm, which comes with Node.js
- Git

### First-time setup

1. Clone the repository and go into it:

   ```bash
   git clone git@github.com:samnichollscodes/secret-santa-draw.git
   cd secret-santa-draw
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Install the browser the end-to-end tests use (only needed once per machine):

   ```bash
   npx playwright install chromium
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173. Changes appear in the browser as you save.

### Scripts

| Command             | What it does                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Starts the dev server with hot reload                                                                                           |
| `npm run build`     | Type-checks, then builds the site into `dist/`                                                                                  |
| `npm run preview`   | Serves the built `dist/` folder locally                                                                                         |
| `npm run typecheck` | Type-checks the app, config and tests                                                                                           |
| `npm run lint`      | Runs Biome (lint and formatting check), then oxlint                                                                             |
| `npm run lint:fix`  | Fixes most lint and formatting problems automatically                                                                           |
| `npm run format`    | Formats the code with Biome                                                                                                     |
| `npm test`          | Runs the Vitest unit tests                                                                                                      |
| `npm run test:e2e`  | Runs the Playwright tests (user flows and accessibility scans) on desktop and mobile. It starts its own dev server on port 5174 |

## Project structure

```text
src/
  main.tsx              Entry point
  App.tsx               Picks the page from the URL: organiser or gift link
  index.css             All styles and theme colours
  components/
    Organiser.tsx       Organiser page: holds the draw and saves it
    NameEntry.tsx       Adding names and households, then drawing
    DrawResults.tsx     The links, sent tracking and Start over
    ConfirmDialog.tsx   On-page confirmation dialog
    Reveal.tsx          The gift link page and present animation
    Header.tsx, Snow.tsx
  lib/
    draw.ts             The draw, and encoding results into links
    households.ts       Reading names and households from what was typed
    storage.ts          Saving the organiser's draw in the browser
    *.test.ts           Unit tests
e2e/                    Playwright tests and the accessibility scan helper
wrangler.jsonc          Cloudflare deployment config
biome.jsonc             Lint and formatting rules
```

Links look like `https://…/#/gift/<token>`. Everything after the `#` stays in the browser and is
never sent to the server, so any static host works without extra setup.

## Deploying

The site is hosted on Cloudflare Workers as static files. Cloudflare's Git integration builds and
deploys `main` automatically on each push, using `npm run build` and then `npx wrangler deploy`.
[wrangler.jsonc](wrangler.jsonc) tells Cloudflare to serve the `dist/` folder at
`secret-santa-draw.samnicholls.dev`.

To deploy from your own machine instead:

```bash
npm run build
npx wrangler deploy
```

Wrangler asks you to log in to Cloudflare the first time.

**Using your own domain:** change the `routes` pattern in `wrangler.jsonc` to a domain on your
Cloudflare account, or remove `routes` to use the free `*.workers.dev` address. `npm run build`
outputs a plain static site, so `dist/` can also be hosted anywhere else, such as GitHub Pages,
Netlify or Vercel.

## Contributing

Read [CODING_STANDARDS.md](CODING_STANDARDS.md) first. It covers TypeScript, React, styling,
linting, testing, accessibility, and the privacy rule that the organiser must never be able to
see who drew whom.

Before committing, run these and make sure they all pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

`npm run lint:fix` fixes most lint and formatting problems for you.
