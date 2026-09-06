# AurorIQ Platform Architecture (v6)

How the tool ecosystem scales without a framework, a backend, or a build system
beyond `build-css.mjs`.

## Principles

1. **Static-first.** Anything SEO-critical is hand-written HTML. JavaScript never
   renders content that Google or AI crawlers need to see. The registry
   (`js/core/registry.js`) powers only non-indexed dynamic surfaces and serves as
   the canonical checklist.
2. **No thin pages, ever.** A category page or tool page ships only when it has
   substantial genuine content (≈1,000+ words for hubs). "Coming soon" lives as
   labeled strips on existing rich pages — never as standalone URLs. This is the
   AdSense low-value-content rule made structural.
3. **Never move the flagship.** `/iq-test/` holds the site's link equity and AI
   referral history. Tools live at root-level, intent-matching slugs
   (`/memory-test/`, `/reading-speed-test/`); category hubs live at
   `/cognition/`, `/psychology/`, `/learning/`, `/career/`, `/productivity/`.
4. **Trust framework is structural.** Every tool page carries the four
   about-instrument blocks (measures / method / result / limits). Psychology
   screeners additionally carry the screening-not-diagnosis block. See
   `BRAND.md §5` and the marked blocks in `templates/tool-page.html`.

## URL & information architecture

```
/                       homepage (platform)
/{category}/            hub: flagship card, domain/topic content, guides, FAQ
/{tool-slug}/           tool page (intake → test → results flow)
/{tool-slug}/results/   noindexed results view (robots.txt Disallow)
/blog/{post}/           guides; each links up to its hub and sideways to tools
/iq-scores/             reference pillar (Cognition)
```

Breadcrumbs: Home → Category → Tool, mirrored in BreadcrumbList schema.

## Adding a new tool — 4 steps

1. **Registry.** Add the entry in `js/core/registry.js` (status `dev` → `live`
   when shipped). Run the registry assertions:
   `node -e "require('./js/core/registry.js')"` plus the test block in git
   history / session notes.
2. **Page.** Copy `docs/templates/tool-page.html` → `/{tool-slug}/index.html`.
   Replace every `{{PLACEHOLDER}}`; copy header/footer/consent verbatim from
   `/cognition/index.html`. Keep visible FAQ and FAQPage schema identical.
3. **Wiring.** Add the tool to: its category hub (flagship card or live grid,
   remove from dev-strip), `sitemap.xml`, and — if it's the category's first
   live tool — promote the homepage platform card from "In development" to a
   live link.
4. **Assets & build.** Generate `og-{tool-slug}.png` (fonts:
   `/home/claude/fonts/` pattern, 4× supersample + LANCZOS). If the tool adds
   CSS, create `css/pages/{tool}.css`, append to ORDER in `build-css.mjs`, run
   `node build-css.mjs`, and bump the `?v=` query on pages that need the fresh
   bundle.

Verification gate (all must pass before deploy): `node --check` on every new JS
file, HTML parses, JSON-LD parses, FAQ schema == visible FAQ, all internal
links resolve, bundle rebuilt with balanced braces.

## Adding a new category hub

Copy `/cognition/index.html` as the reference implementation (it is the
category template in living form): breadcrumbs → cat-hero → flagship →
topic content (engine-cards) → interpretation/posts → dev-strip → FAQ →
cta-band. Ship only when the category has at least one live tool AND enough
genuine supporting content to clear ~1,000 words.

## Internal linking mesh (v6 rules)

Rule-based so it scales to hundreds of pages without ad-hoc decisions:

1. **Up (breadcrumbs).** Every page links its parent chain, visibly and in
   BreadcrumbList schema: tool → category → home; guide → blog → home.
   Reference pillars that belong to a category (e.g. /iq-scores/) breadcrumb
   through the category, not just home. App-shell pages (test UIs) carry the
   schema chain without the visible bar.
2. **Down (hubs).** A category hub links every live tool, every relevant guide
   (grouped), and its reference pillar. The homepage links every hub.
3. **Sideways (contextual).** Every guide's Related section ends with a
   standing card to its category hub, after 2 topical guide cards. Every tool
   page links 3 topical guides. Hub topic cards deep-link guides inline where
   the sentence naturally supports it.
4. **Global (footer).** The Platform footer column (all pages) carries: all
   instruments anchor, each live hub, each live external sister instrument.
5. **Budget.** Stay under ~100 links per page; prefer one contextual in-prose
   link over three navigational ones; never link the same target twice in one
   body section.

New pages inherit the mesh automatically by following the templates — the
crumbs, Related-section hub card, and footer column are structural.

## Component inventory (reusable everywhere)

- `.platform-card` — category/tool cards (homepage + hubs)
- `.engine-card` — method/domain explainer cards
- `.post-card` / `.posts` — guide grids
- `.flagship` — hub hero card for the category's lead instrument
- `.dev-strip` — honest "in development" lists
- `.crumbs` — breadcrumbs (pair with BreadcrumbList schema)
- `.faq` / `.faq__item` — FAQs (pair with FAQPage schema)
- `.cta-band` — closing conversion band
