# Pixely website — project state

_Snapshot taken 2026-10-10 on branch `feat/pixely-rebrand`. Analysis only; no code was changed. This file is not committed._

---

## Update 2026-10-11: back to the platform site

The identity-and-fraud waitlist pivot has been dropped. Commit `4906f0f` was reverted. Where this update conflicts with the sections below, this update wins.

**What's live now:**
- `/` is the full platform homepage again: "We make money move" plus all ten chapters, Navigation, TravellingDevice and Footer.
- Payments, identity and AI for Algeria is the positioning.

**What's gone:** the waitlist API, `WaitlistForm`, `HeroPortrait`, the ID-card image, the waitlist tests, the `wordpress/` packager, the Brevo variables and the waitlist privacy text. All of it is still in git history.

**Still valid from below:** the stack, the structure, the design system, and the parked-chapter notes, which now describe the live homepage.

**Revised priorities:**
1. Remove or verify the invented figures in `UseCases` and the `FinalCTA` perks.
2. Settle the domain and legal entity, and refresh the legal pages.
3. Run a QA pass across viewports, Lighthouse, a11y and reduced motion.
4. Add the SEO basics (robots, sitemap, OG image) and `noindex` on `/lab`.
5. Give the other five services their own pages, following `/platform/identity`.
6. Add tests and CI, and replace the boilerplate README.

---

## 1. TL;DR

- **What it is:** a Next.js 16 / React 19 marketing site for Pixely, with WebGL scenes, GSAP scroll choreography, Lenis smooth scroll and a custom cursor. There is also a waitlist backend (Brevo), Google/Apple OAuth, a stub account area, one service page (`/platform/identity`), internal `/lab` pages, and a WordPress export of the hero.
- **Where it stands:** the last committed homepage was a full 10-chapter "payments + identity + AI platform" story. The **uncommitted** work pivots the homepage to a **single-screen "AI-powered Identity & Fraud" landing**: hero, waitlist form and an identity-scan artwork. The other nine chapters, the navigation, the travelling phone and the footer are all disconnected from `/` but still in the repo.
- **Health:** `tsc --noEmit` passes, `eslint src` is clean, and `node --test tests/waitlist.test.mjs` passes 7/7. I didn't run the site in a browser this session.
- **Biggest risks:**
  1. 321 commits and the whole pivot exist **only on this laptop**. There is no git remote.
  2. The positioning is split between "fintech platform" and "identity & fraud for banks". The copy, metadata and legal pages disagree with each other.
  3. The parked chapters contain unverified figures, which break the site's own "nothing invented" rule.

---

## 2. Tech stack and how to run it

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.3.1** (App Router, `src/app`). `AGENTS.md` warns this version has breaking changes, so read `node_modules/next/dist/docs/` before writing Next-specific code. |
| UI | React 19.2.8, TypeScript 5 (strict), path alias `@/*` → `src/*` |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` in `src/app/globals.css`, no `tailwind.config`), PostCSS |
| Motion | **GSAP 3.15** with ScrollTrigger, SplitText and MotionPathPlugin (registered in `src/lib/gsap.ts`, default ease `expo.out` 0.9s); **Lenis 1.3** smooth scroll |
| 3D | **three 0.185** + **@react-three/fiber 9** (HeroScene, NetworkScene, IdentityScene, BackgroundLab); the Globe is a custom canvas renderer |
| Fonts | `next/font/google`: Archivo (wdth axis), Fraunces italic (SOFT/WONK/opsz), IBM Plex Mono, Martian Mono, Nunito |
| Backend | Route handlers: `/api/waitlist` (Brevo), `/api/auth/*` (Google + Apple OAuth, signed cookie session), `/api/verify-email` (MX/SMTP probe) |
| Tests | Node's built-in test runner. One file, `tests/waitlist.test.mjs`, mocks Brevo. |
| Lint | ESLint 9 flat config with `eslint-config-next` (core-web-vitals + typescript) |

**Run:**

```bash
npm install
```

```bash
npm run dev
```

- Opens on http://localhost:3000. `.claude/launch.json` defines a `dev` preview with `autoPort`.
- Other commands: `npm run build`, `npm start`, `npx eslint src`, `npx tsc --noEmit`, `node --test tests/waitlist.test.mjs`.

**Environment** (names only; see `.env.example`, secrets live in the git-ignored `.env.local`):

- **Auth:** `AUTH_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
- **Email probe:** `SMTP_PROBE`, `SMTP_PROBE_HELO`, `SMTP_PROBE_FROM`
- **Waitlist:** `BREVO_API_KEY`, `BREVO_WAITLIST_LIST_ID`, `BREVO_SENDER_EMAIL`
- **What happens when they're missing:** the waitlist answers 503 "temporarily unavailable", and each OAuth button reports itself as not connected.

**WordPress package:** `node wordpress/build.mjs` builds `wordpress/dist/pixely-landing.zip`, a WP plugin that serves the hero through the shortcode `[pixely_identity_landing]`. You need a prior `next build` for the cached fonts, plus esbuild installed at `/tmp/pixely-wp-build`. To preview it, run `node wordpress/preview.mjs` (port 3001).

---

## 3. Folder and component structure

```
src/
  app/
    layout.tsx            fonts, root metadata (pixely.dz), body.grain bg-ink
    page.tsx              HOME: SmoothScroll + CustomCursor + Wordmark header + <Hero/> only (uncommitted)
    globals.css           1,664 lines: tokens, themes, type utilities, nav/auth/glyph/globe/identity CSS
    platform/identity/    first service page (ServicePage template)
    dashboard/ profile/ settings/   signed-in account shell, honest empty panels
    privacy/ terms/ legal-page.tsx  legal stubs (privacy now waitlist-specific)
    lab/{brand,logo,type,words,backgrounds}  internal design labs; publicly routable
    api/
      waitlist/route.ts   Brevo contact + confirmation email (new, uncommitted)
      auth/[provider]/{start,callback}, providers, session, signout
      verify-email/route.ts
  components/
    chrome/     Navigation (1,312 lines), MobileMenu, NavGlyph, AuthDialog (946), AccountMenu,
                SignOutDialog, Footer, CustomCursor, SmoothScroll (Lenis ctx), TravellingDevice
    sections/   Hero, Manifesto, ProductExperience (+ProductUI/ProductUIMobile), NetworkNarrative,
                SecurityArchitecture (1,366), GlobalCorridors, Metrics, UseCases, Thesis, FinalCTA
    service/    ServicePage (Shell/Hero/Band/FeatureGrid/FlowSteps/CTA), ChecksCinema, CheckGlyphs,
                IdentityGlyph, SignalStream
    three/      HeroScene, NetworkScene, IdentityScene (1,249), BackgroundLab
    ui/         Globe (1,108), WalletScreen (970), HeroDevice, HeroPortrait (new), WaitlistForm (new),
                MagneticButton, DotMatrixText, FitText, CountUp, RotatingWord, SwappingWord,
                WordmarkTrace, ZnapSignature
    account/    shell (requireSession, AccountShell, EmptyPanel), SignOutButton
  lib/          gsap, hooks (useMediaQuery/useReducedMotion/useFinePointer/useMounted), menu (site IA),
                data (demo ledger), corridors, countries (3k lines), worldmap (6.4k lines), oauth, email,
                smtp-probe, auth-trigger, device, rng
public/images/hero-identity.jpeg    7500×4184, 3.0 MB source (new, uncommitted)
tests/waitlist.test.mjs             (new, uncommitted)
wordpress/                          WP plugin packager for the hero (new, uncommitted; dist/ ignored)
pixely-gep/                         UK delegation pitch deck build + outputs (not site code)
```

The source is about 31.5k lines, but about 9.4k of that is data (`countries.ts` and `worldmap.ts`).

---

## 4. Design system

All tokens live in `src/app/globals.css` under `@theme`. The site's own design reference is `/lab/brand`, which renders the shipped tokens live.

### Colour: "ink / bone / signal"

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` / `ink-3` | `#0a0a0b` / `#111113` / `#1a1a1e` | dark grounds |
| `bone` / `bone-2` | `#ece9e1` / `#f2f0ea` | light ground and text on ink |
| `signal` | `#2d46ff` | the one brand blue (233°, AA on bone at 5.04:1) |
| `signal-lift` / `signal-glow` / `signal-deep` | `#7290ff` / `#9fb4ff` / `#1f33d6` | tint for headroom; glow is for canvas/GL only; deep |
| `positive` / `negative` | `#23855c` / `#e01838` | semantic |

- **Chapter theming:** each section sets `data-theme="ink"` or `"bone"`, and its children read semantic variables: `--bg --fg --muted --faint --line --line-strong --surface --accent`.
  - Those variables are registered with `@property`, so the nav can animate them as it crosses from one chapter to the next (`.nav-ground`, 560ms, `--ease-cross`).
- **Helper utilities:** `bg-theme`, `text-theme`, `text-muted`, `border-line`, `bg-accent` and similar.
- **Off-palette exception:** the new identity hero CSS adds a cyan/ice family (`#9eeeff`, `#73eaff`, `#c5f4ff`…) as raw hex outside the token system.

### Typography

| Role | Utility | Setting |
|---|---|---|
| Display (the "voice") | `type-display` | Archivo, wdth 125%, weight 600, UPPERCASE, −0.015em, lh 0.94 |
| Section headline | `type-headline` | Archivo wdth 118%, weight 570, uppercase, lh 0.98 |
| Counter-voice | `type-serif` / `type-serif-inherit` | Fraunces italic, opsz 144, SOFT 0, WONK 1 (lowercase, human) |
| Machine labels | `type-label` | Plex Mono 11px, uppercase, 0.16em tracking, lh 1.5 |
| Figures | `type-mono` | Plex Mono, tabular nums |
| Clock only | `--font-clock` | Martian Mono 500 (globe HUD) |
| Wallet mock only | `--font-nunito` | Nunito (inside the phone UI) |

- **Body text:** Archivo 400, 16/1.5.
- **Fluid size utilities:**
  - `text-hero` and `text-hero-aside` are clamped by both width and height, and solved against the length of the headline.
  - `text-giant` runs 2.8–9rem, `text-big` 2.2–5.5rem, `text-mid` 1.5–2.75rem.
- **New hero headline:** it overrides these with its own clamp(2rem, 4.2vw, 4.25rem) at lh 1.08, and it doesn't use the Fraunces counter-voice.

### Spacing and grid

- **Page gutters:** `px-6` / `sm:px-10` / `lg:px-14`, i.e. 24 / 40 / 56px. The nav uses matching `--nav-gutter` and `--nav-inset`.
- **`beside` custom variant:** `(width ≥ 64rem) and (orientation: landscape)`. It's the main layout switch, used wherever an artwork sits next to text. It deliberately treats a portrait iPad as "stacked", not desktop.
- **Section rhythm:** roughly 15–22vh vertical padding. Statements use a centred `max-w-[60rem]` column with ragged-left text. Headlines are capped by `ch`, e.g. `max-w-[14ch]`.
- **Radii:** `--radius-control` 18, `--radius-chip` 18, `--radius-panel` 22. Product mocks use radii derived from these (`--radius-mock` = control ÷ 2, `--radius-mock-tag` = control ÷ 4).
- **z-index scale:** canvas 0 → content 10 → nav 100 → menu 110 → nav-over-menu 120 → dialog 125 → cursor 130.
- **Texture:** `body.grain` puts a film-grain overlay on every page. `.section-index` gives a numbered eyebrow like "01 — Manifesto".

### Motion

- **Easing tokens:**
  - `--ease-out-expo` cubic-bezier(.16,1,.3,1), the house curve
  - `--ease-inout-soft` (.65,0,.35,1)
  - `--ease-swift` (.55,0,.1,1)
  - `--ease-cross` (.4,0,.2,1), for colour crossings
- **Duration tokens:** 200 / 500 / 900ms.
- **Signature moves:**
  - Masked line reveals: lines start at `yPercent` 140 and stagger in at 0.095s with `expo.out`, gated on `document.fonts.ready`.
  - Scroll-scrubbed word reveals (SplitText) and pinned chapters (Thesis, ProductExperience stages).
  - Magnetic buttons and a custom cursor that reads `data-cursor` and `data-cursor-label`.
  - Pointer-parallax WebGL heroes, and blinking-caret wordmark details.
  - The identity hero adds:
    - pointer depth/tilt driven by CSS variables (`--depth-x/y`)
    - a 3.2s scan sweep, a radar wave and a constellation trace
    - an orbit animation and a pause button
- **Accessibility:** `prefers-reduced-motion` is respected throughout. You get static posters instead of WebGL, animations are off, and motion pauses when the hero is off-screen or the tab is hidden.

---

## 5. Pages and sections: completeness

### Live routes

| Route | State | Notes |
|---|---|---|
| `/` | **Hero only (uncommitted pivot).** About 85% done as a one-screen landing. | Wordmark-only header, no nav, no footer. Headline "AI-POWERED / IDENTITY & FRAUD / Solution", one sub-line, Brevo waitlist, HeroPortrait scan artwork, WebGL HeroScene behind it. No social proof, no explanation of what the product does, no footer or legal links except the "Privacy" link in the form note. |
| `/platform/identity` | About 80% | Full service page (hero, ChecksCinema, flow, features, CTA) with Navigation and Footer. Copy says "for **fintechs**". Its CTAs open the auth dialog, not the waitlist. |
| `/dashboard`, `/profile`, `/settings` | Shell, intentionally empty | Needs an OAuth session. Panels honestly say "nothing yet". |
| `/privacy` | Updated for the waitlist | Covers Brevo, rate counters and removal requests to admin@pixely.com. It no longer mentions the OAuth sign-in or the email-domain lookup, both of which still exist in code. |
| `/terms` | Placeholder | Says "no account can be opened… sign-up form is not connected", which is now untrue: OAuth works when it's configured, and the waitlist is live. Mentions "authorised electronic money institution". |
| `/lab/*` | Internal | Brand, logo, type, words and backgrounds labs. Publicly routable, and none of them are `noindex`. |

### Parked homepage chapters

These are built but not mounted on `/`:

| # | Section | State | Notes |
|---|---|---|---|
| 01 | `Manifesto` | Done | Scroll-scrubbed statement, "payment and identity, one platform". The uncommitted diff removed its travelling-device scrims. |
| 02 | `ProductExperience` (+ ProductUI / ProductUIMobile) | Done | Pinned 4-stage treasury dashboard: ledger, payments, FX, controls. Uses Algerian demo data (DZD, ARTS/ATCI/SWIFT). |
| 03 | `NetworkNarrative` + NetworkScene | Done | Payments, identity, intelligence and compliance stages. |
| 04 | `SecurityArchitecture` | Done (bone chapter) | Signed/scoped API, identity, limits, append-only ledger, with packet-trace SVG. |
| 05 | `GlobalCorridors` + Globe | Done | Rotating globe with corridor arcs and a departure-board clock HUD. |
| 06 | `Metrics` | Done | Six core services with count-up numbering (deliberately no figures). |
| 07 | `UseCases` | Done visually, **copy unsafe** | Tabs for startups, enterprises, platforms, finance and global. Contains invented stats: "6 days", "120k", "1.4s P99", "98.6%", "40 markets", "on Pixely's licences". |
| 08 | `Thesis` | Done | Pinned "old order struck through → new arc" exchange. |
| 09 | `FinalCTA` | Done | "Build what moves money." Promises a sandbox in minutes, a named integration engineer and no minimum volume. These are unverified commitments. |
| — | `Navigation`, `MobileMenu`, `Footer`, `TravellingDevice`/`HeroDevice`/`WalletScreen`, `RotatingWord` | Done | Only used by the service page now, or not used at all. `menu.ts` describes the site map as payments, wallets, identity, AI, compliance and APIs. |

### Other deliverables in the tree

- **`wordpress/`:** packages the identity hero as a WP plugin. Its README says the WP draft is **page 1707** ("AI-powered Identity & Fraud", unpublished). Earlier notes recorded **draft 1670** as the Identity landing, so confirm which page ID is current.
- **`pixely-gep/`:** UK delegation pitch deck build files. This isn't website code; it's committed but its `.build` assets probably shouldn't be.

---

## 6. Copy direction and positioning

There are two positioning strands in the repo.

**A. Committed site (platform story).**
- Pitch: "We make money **move** _instantly / securely / your way_" (rotating serif word). Pixely as financial infrastructure for Algeria, "payments, digital identity and AI in one platform".
- Audience: startups, enterprises, platforms and finance teams.
- Tone: editorial, confident and engineer-to-engineer ("Talk to an engineer, not a sales development representative").
- Proof: Algerian specifics like DZD formatting and ARTS/ATCI rails.

**B. Uncommitted pivot (identity and fraud).**
- Pitch: "**AI-powered Identity & Fraud Solution** — AI-powered KYC and fraud detection for **banks and financial institutions in Algeria & MENA — hosted locally, privacy-first**."
- Audience: banks and FIs, a B2B enterprise buyer.
- Call to action: join the waitlist.
- Visual metaphor: the ID card under scan ("01 / IDENTITY FIELD", "ALGÉRIE · MENA").

**House rules visible in the code comments:**
- Nothing invented: no figures, certifications, latency or accuracy claims.
- Legal text is never approximated.
- Be honest about empty states.
- The Identity page holds to these rules. The UseCases chapter and the FinalCTA perks don't.

**Inconsistencies to settle:**

| Where | Says |
|---|---|
| Root `layout.tsx` metadata | "AI-powered fintech platform", payments-led, `metadataBase` **pixely.dz** |
| Home metadata | Identity & fraud for banks |
| `/platform/identity` | "for fintechs" |
| Hero headline | "IDENTITY & FRAUD Solution": mixed case on the last word, and "Solution" is generic |
| Legal footer | "Pixely Financial Technologies Ltd." |
| Privacy contact | admin@pixely.com (.com, while the canonical domain is .dz) |

---

## 7. Git state

- **Branch:** `feat/pixely-rebrand`, 321 commits ahead of `main`. `main` is still only "Initial commit from Create Next App" (2026-08-18).
- **Other branches:** `feat/meridian-site` is an ancestor of the current branch, with nothing unique on it.
- **Remotes:** **none.** Nothing has been pushed anywhere.
- **Stashes:** none.
- **Latest commit:** `0b8e14b Face act: a dotted scan mesh, not a contour head`.
- **Uncommitted, modified (9 files, +146/−314):**
  - `.env.example`: Brevo variables
  - `.gitignore`: `/wordpress/dist/`
  - `README.md`: waitlist docs
  - `next.config.ts`: image `qualities` and large `deviceSizes`
  - `globals.css`: identity hero CSS
  - `page.tsx`: hero-only homepage with metadata
  - `privacy/page.tsx`
  - `Hero.tsx`: identity rewrite. Removed HeroDevice, RotatingWord, ScrollHint, the pillars, the scroll-out fade and the auth CTAs.
  - `Manifesto.tsx`: removed the travelling-device scrims
- **Uncommitted, untracked:** `public/images/` (3 MB hero JPEG), `src/app/api/waitlist/`, `src/components/ui/HeroPortrait.tsx`, `src/components/ui/WaitlistForm.tsx`, `tests/`, `wordpress/`
- **Ignored, present:** `.env.local` (not read), `.next/`, `tsconfig.tsbuildinfo`, `wordpress/dist/`
- **Clutter:** `.DS_Store` files are ignored, but one sits in `src/`.

---

## 8. Weaknesses and unfinished parts

**Critical**

1. **No backup.** There is no remote, and the whole pivot is uncommitted, so one disk failure loses everything.
2. **Positioning isn't decided.** It's unclear whether the product is a platform for fintechs or identity and fraud for banks. Until that's settled, the parked chapters, the nav IA (`menu.ts`), metadata and legal copy can't be finalised.
3. **Invented claims** in `UseCases` (stats and "Pixely's licences") and in the `FinalCTA` perks. They contradict the site's own rule, and they're risky for a regulated-sector brand. The legal pages also mention an "authorised electronic money institution". Verify that status before anything that says so goes live.
4. **Hero image licensing.** `hero-identity.jpeg` carries stock-style EXIF ("The Identity Glitch: Futuristic Smart ID Card…"). Confirm the licence before publishing.

**High**

5. **The homepage is a single screen.** There's no nav or footer, no "how it works", no product proof, no trust or security story, and no contact route for banks; enterprise buyers need more than a waitlist. The parked Identity page and Security chapter already contain most of this.
6. **Legal pages are stale.** Terms says sign-up isn't connected. Privacy omits OAuth sessions and the email-domain lookup. No company address, controller or jurisdiction is given, and Algerian law 18-07 isn't referenced.
7. **CTAs don't match the funnel.** The site has two funnels: the home waitlist, and the auth dialog ("Get started" → create account) on the Identity page, nav and FinalCTA.
8. **SEO and ops basics are missing.** No `robots`, `sitemap`, OG image, structured data or analytics. The canonical domain is ambiguous (`pixely.dz` vs `.com`). `/lab/*` is publicly indexable.
9. **Waitlist operations.** Rate limiting is per instance (in memory), so you need edge rate limiting in production. There's no double opt-in, and there's no Brevo setup checklist beyond the README.

**Medium**

10. **The design system is drifting.** The identity hero CSS is minified one-liners with raw cyan hex outside the `@theme` tokens. It hardcodes `Archivo,Arial` and `#0a0a0b`, and it ignores the house type (no `text-hero`, no Fraunces counter-voice).
11. **Asset weight.** The source image is 7500 px and 3 MB, and `deviceSizes` reaches 5120. Next's optimiser handles delivery, but cold renders are expensive. Pre-sized AVIF/WebP masters would be leaner, as the WordPress build already does.
12. **Dead code after the pivot.** `TravellingDevice`, `HeroDevice`, `WalletScreen`, `RotatingWord`, `ScrollHint` CSS and the `text-hero*` utilities are unused on `/`. Leave them until the IA is decided.
13. **The README is still the create-next-app boilerplate** apart from the waitlist section. `layout.tsx` metadata and `themeColor` are platform-era.
14. **Thin tests.** Only the waitlist route is covered. There are no e2e tests or visual/a11y checks (Playwright + axe would fit), and no CI.
15. **The repo mixes concerns.** `pixely-gep/` (pitch deck and its build intermediates) lives in the site repo.
16. **Two homepages to maintain.** The WordPress bundle duplicates the hero, so the hero now ships in two places that can drift.

---

## 9. Prioritised plan, continuing in the same direction

Ordered so each step unblocks the next. None of it has been started.

**P0: protect and decide (today)**

1. Create a private GitHub remote and push `feat/pixely-rebrand`. Commit the pivot as its own commit, or a few: "Identity hero + waitlist", "WordPress package", "privacy notice". This needs your go-ahead.
2. **Decide the positioning,** in a short written brief. My recommendation is to keep the identity-and-fraud-for-banks-and-FIs (Algeria & MENA, hosted locally) line as the homepage, and treat payments and wallets as a "platform roadmap" rather than the lead.
3. **Decide the domain and legal entity:** `.dz` vs `.com`, and the exact company name. Also confirm what licensing claims, if any, can be made.
4. Confirm the hero image licence and the live WordPress draft ID (1707 vs 1670).

**P1: turn the one-screen hero into a complete landing (reuse what's built)**

5. Restore a slim **Navigation and Footer** on `/`, with the IA in `menu.ts` re-cut for identity: Product (KYC, document/NFC, liveness, fraud signals), Deployment (on-prem/local hosting), Security, Company, Contact.
6. Add sections below the hero by **re-skinning existing work, not rebuilding it**:
   - a. a **Manifesto** statement rewritten for identity and fraud
   - b. a **"How it works"** chapter, from the Identity page's `ChecksCinema` and `FlowSteps`
   - c. **Security and data residency**, from `SecurityArchitecture` re-pointed at local hosting, privacy-first and audit
   - d. a **"Built for"** chapter (banks, microfinance, fintechs, telcos), from the `UseCases` tab pattern with **all invented stats removed**
   - e. a **Final CTA** with two routes: join the waitlist, or book a demo / talk to us (contact form or mailto), using `FinalCTA`
7. Align CTAs to one funnel: waitlist or demo. Hide the auth dialog and "Create account" until accounts are real.
8. Update the root `layout.tsx` metadata, OG copy and `themeColor`, and the `/platform/identity` audience ("banks and FIs").

**P2: polish to Awwwards level, inside the existing system**

9. Bring the identity hero CSS into the system:
   - Move the cyan values into `@theme` tokens (e.g. `--color-scan-*`) and un-minify them into commented rules, matching the house style.
   - Revisit the headline with `type-display` sizing and a Fraunces counter-voice word, e.g. "Identity, _proved_." This matches the Identity page's "Every user, _proved_".
10. Check the motion choreography so the hero and the chapters use the same easing tokens, the same reveal pattern and the same reduced-motion fallbacks. Make sure the scroll-out fade suits the new hero now that there's content below it.
11. **QA pass** in the browser preview:
    - viewports 375 / 768 portrait / 1024 landscape / 1440 / 1920
    - the `beside` breakpoint
    - Lighthouse (LCP of the hero image, WebGL cost)
    - keyboard and screen reader
    - reduced motion

**P3: launch hygiene**

12. Rewrite `/privacy` (waitlist, OAuth if kept, email lookup, Brevo, retention, controller, law 18-07) and `/terms` with counsel.
13. Add `robots.ts`, `sitemap.ts` and OG images (`opengraph-image.tsx`). `noindex` or gate `/lab/*`. Add privacy-friendly analytics if wanted.
14. Set edge rate limiting and the Brevo checklist (list, sender, `PIXELY_WAITLIST_CONFIRMED` attribute, IP allowlist). Run one real end-to-end signup on staging.
15. Add a Playwright smoke and accessibility test for the hero and the waitlist, plus CI (lint, types, tests).
16. Rebuild the WordPress package from the final hero, or decide that a single host (Vercel or WP) is canonical so there's only one homepage.

**P4: housekeeping**

17. Replace the boilerplate README with the real run and deploy guide.
18. Move `pixely-gep/` out of the site repo.
19. Delete truly dead components once the IA is final.
