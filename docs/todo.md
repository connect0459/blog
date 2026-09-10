# Blog Redesign Implementation Plan (Sovereign Archive / Unified Timeline)

This repository is currently the unmodified Astro starter blog template. This plan replaces it with the design captured in the provided Claude Design mockups: a monochrome, minimalist personal blog ("Sovereign Archive") whose home page is a single chronological timeline mixing native articles and external cross-posts (catnose.me-style), grouped by year, with no tags and no tabs.

## Decisions already settled by the design conversation

- **Content model**: no `articles`/`zenn` path split. Every post — native or an external cross-post to any site — is one row in a single home-page timeline, grouped by year, newest first. Native posts still live at `/articles/<slug>/`; external posts link straight out.
- **Tags are out of scope.** No tag cloud, no per-tag pages, no `tags` frontmatter field.
- **No dark mode.** The design is a single fixed light palette; do not add a `prefers-color-scheme` override or a manual toggle.
- **Typography**: Noto Sans JP only, for Japanese and Latin/numeral text alike. The mockup's stylesheet also defines `--font-serif` (Noto Serif JP) and `--font-editorial` (Zen Kurenaido) tokens, but neither is applied to any element in the markup — treat them as vestigial and do not port them.
- **Spacing/shape**: strict 8px spacing scale, `radius: 0` everywhere, links use a ghost-underline hover (animated `background-size`, not `text-decoration`).
- **Dates**: frontmatter stays `yyyy-MM-dd`. The short date shown on each timeline row is `MM-dd`; the article page shows the full date.
- **Header**: site name (links home) + an `RSS` link. No nav links, no search/theme-toggle/social icons in the header.
- **Home page**: profile block (avatar, name, one-line bio, GitHub/Zenn/X links) above the timeline. No separate `/about` page.
- **Article page**: back-to-list link, date + title, prose body, an author bio card at the bottom, then prev/next links to adjacent native articles.
- **Footer**: a single copyright line, nothing else.

## Decisions confirmed with the user (2026-09-10)

- **External-entry favicons**: no runtime third-party dependency. When a `links` entry is added, the author runs a local fetch script (Phase 5) that downloads the target site's favicon once and commits it into the repo (e.g. `src/assets/favicons/<domain>.<ext>`). Pages read only the committed local asset; there is no favicon fetch at build or request time. If no local asset exists for a domain, render the self-generated initial-letter placeholder instead. Rejected: a live favicon-fetch service called from the page, because it leaks visitor referrer data to a third party on every view and makes the static site depend on that service's uptime.
- **External entries as a content collection**: confirmed — a second Astro content collection `links` with a `{ title, url, pubDate }` schema, validated the same way as `articles`.
- **RSS feed scope**: confirmed native-only (`articles`); `links` entries are excluded since the feed cannot carry content this site doesn't host.
- **Coverage target** for the Phase 2 timeline domain logic: 100%. Justified by the module being pure functions with no DOM/Astro boundary and few branches, so full coverage is cheap and directly enforces the Detroit-school TDD approach already mandated by `CLAUDE.md`.

---

## Phase 0: Tooling prerequisites

- [x] Add Vitest as a devDependency; add `"test": "vitest run"` / `"test:watch": "vitest"` to `package.json`. Nothing in this project currently runs unit tests, and Phase 2 needs a runner before any Red/Green cycle can start.
- [x] Confirm the coverage target for the new domain logic with the user (see open decisions above).

## Phase 1: Content model

- [x] Rename the `blog` collection to `articles` in `src/content.config.ts` (loader base `./src/content/articles`); schema unchanged (`title`, `description`, `pubDate`, `updatedDate?`, `heroImage?`).
- [x] Add a `links` collection for external cross-posts: `{ title: string, url: z.url(), pubDate: z.coerce.date() }`, no body content (implemented via the `file()` loader over a single keyed `links.yaml`, since there is no per-entry body).
- [x] Remove `src/pages/about.astro` — its role is replaced by the home page's inline bio.

## Phase 2: Timeline domain logic (Red/Green TDD)

Package-by-features: new `src/features/timeline/` directory. Everything here is pure data transformation over in-memory values — no DOM/Astro boundary, so no mocks are needed (Detroit-school).

- [ ] Write failing tests first for `src/features/timeline/model.ts`:
  - `toTimelineEntry` — maps an `articles` entry to an internal entry (`href: /articles/<slug>/`) and a `links` entry to an external one (`href: url`, `domain: new URL(url).hostname`).
  - `groupByYear` — groups entries by calendar year from the ISO date; years and in-year entries both sorted descending.
  - `formatShortDate` — `yyyy-MM-dd` → `MM-dd`.
  - `findAdjacentEntries` — prev/next native article relative to the current one, given a date-sorted list.
- [ ] Implement until green.

## Phase 3: Design tokens & global styles

- [ ] Replace the `:root` tokens in `src/styles/global.css` with the mockup's palette (background/surface/primary/on-surface/secondary/tertiary/outline + ghost-border rgba tokens), type scale (display/headline/title/body/label/caption — size, line-height, letter-spacing), 8px spacing scale, `--radius: 0`, and motion/easing tokens. Drop the Bear-Blog-derived tokens they replace (`--accent`, `--gray-gradient`, `--box-shadow`).
- [ ] Re-derive base element rules from the mockup: `h1`–`h3` sizes/weights, `p`/`small` text styles, ghost-underline link hover, `code`/`pre` monospace styling.
- [ ] Do not add a dark-mode block.
- [ ] Fonts: in `astro.config.mjs`, replace the local `Atkinson` font entry with Noto Sans JP via `fontProviders.google()`; remove `src/assets/fonts/atkinson-*.woff` once unused; rename the `--font-atkinson` CSS variable (and its `Font cssVariable` usage in `BaseHead.astro`) to `--font-sans`.
- [ ] Standardize on a 680px centered max-width container across all pages, replacing the current ad-hoc 720px/960px widths in `index.astro`, `blog/index.astro`, and `BlogPost.astro`.

## Phase 4: Layout & components

- [ ] `Header.astro`: reduce to the site name (linking to `/`) plus an `RSS` link to `/rss.xml`; remove the `HeaderLink` nav and the social SVG icons (those move into the home profile block).
- [ ] `Footer.astro`: reduce to a single copyright line sourced from `consts.ts`; remove the duplicated social icon links.
- [ ] `src/pages/index.astro`: profile section (avatar, name, one-line bio, GitHub/Zenn/X links) followed by the timeline built from `groupByYear(...)` over merged `articles` + `links` entries. Remove the current starter-template welcome copy.
- [ ] Remove `src/pages/blog/index.astro` — its listing role is fully replaced by the home timeline.
- [ ] Article page (`src/pages/articles/[...slug].astro` + `src/layouts/BlogPost.astro`, renamed if appropriate): back-to-list link, date + title header, prose body, author bio card, then a prev/next row driven by `findAdjacentEntries`.
- [ ] `FormattedDate.astro`: support both the article page's full date and the timeline row's `MM-dd` short date.
- [ ] Drop the hero-image block from the article layout — the mockup shows no cover images. Keep `heroImage` in frontmatter only as an OGP-image source, not rendered inline.

## Phase 5: Content migration

- [ ] Remove the starter sample posts (`first-post.md`, `second-post.md`, `third-post.md`, `markdown-style-guide.md`, `using-mdx.mdx`).
- [ ] Write a local favicon fetch script (e.g. `scripts/fetch-favicon.mjs`) that downloads a given domain's favicon once and saves it under `src/assets/favicons/<domain>.<ext>`, for the author to run manually when adding a `links` entry; the timeline falls back to the initial-letter placeholder when no committed asset exists for a domain.
- [ ] Add the real external cross-posts as `links` entries (title/url/pubDate only), running the favicon fetch script for each and committing the resulting asset.
- [ ] Author at least one real native article under `src/content/articles/` to validate the article layout end-to-end.
- [ ] Add a real avatar image for the home profile block, replacing the mockup's placeholder box.

## Phase 6: SEO/meta & feed

- [ ] `src/pages/rss.xml.js`: read from the `articles` collection, with links pointing at `/articles/<id>/`; confirm whether `links` entries are included too (see open decisions).
- [ ] Update every remaining `getCollection('blog')` call site to `'articles'`.
- [ ] Set the real `site` URL in `astro.config.mjs` (currently `https://example.com`) once the hosting domain is decided.

## Phase 7: QA & CI

- [ ] `npm run format:check && npm run lint && npm run lint:md && npm run typecheck && npm run build` all green.
- [ ] `npm test` (Vitest) green for the Phase 2 domain logic.
- [ ] Manual check in a real browser: the light palette holds regardless of OS dark-mode preference, link hover draws in correctly, timeline grouping/ordering is correct, article prev/next is correct, and the RSS feed validates.
- [ ] Add the `test` script to `.github/workflows/ci.yml` alongside the existing checks.
