# Pond design system

## Overview

Pond is an independent reading interface for the identity.md community. A dark evergreen canvas, lime actions and an illustrated squad of AI-equipped Pepes carry the visual direction. The core surface is a ranked, attributed tweet feed. The hero stays compact so a complete tweet and its read/save/share controls fit on the first 390 × 844 screen.

The implementation lives in `src/App.tsx`, `src/styles.css`, `src/icons.tsx` and `src/posts.ts`. Styles are plain CSS with a small token set; there is no component framework, wallet infrastructure or theme switcher. The screenshot evidence in `docs/evidence/` shows the final export.

## Colors

Canonical primitives and semantic aliases are declared in `src/styles.css:8`.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--bg`, `--on-accent` | `#0b1510` | Page background; text on lime |
| `--surface` | `#101c15` | Tweet cards and search field |
| `--surface-raised` | `#14231a` | Dialog and ecosystem link |
| `--surface-hover` | `#1b2d21` | Neutral controls, hover and selected navigation |
| `--border` | `#263d2c` | Structural outlines and separators |
| `--text` | `#edf2e9` | Primary text |
| `--muted` | `#a3b4a4` | Metadata, descriptions and inactive controls |
| `--accent`, `--focus` | `#c4ef78` | Primary action, current navigation, saved state and focus |
| `--accent-hover` | `#d5f5a5` | Primary button hover |

The neutral button hover border uses `--green-700` (`#3a5940`). The first ranked card uses a local `#132018` background and `#536d3e` border. The hero has `#12251a` beneath the artwork, an evergreen alpha gradient, and `#d0dccc` supporting text. These are deliberate component-specific values rather than additional global ramps. Forced colors uses platform `Canvas`, `CanvasText`, `Highlight` and `ButtonText`.

Solid text pairs passed the rendered contrast probe. Image-backed hero contrast is treated separately in `docs/VALIDATION.md`; do not infer a contrast ratio from a swatch alone.

## Typography

Use **Manrope**, with `Arial, sans-serif` fallback. The local variable Latin WOFF2 is `public/fonts/manrope-latin.woff2`, licensed under SIL OFL. `@font-face` declares its real 200–800 range; the page uses only **400, 600, 800**. The font is preloaded from the same URL the stylesheet uses. Synthesis is disabled and all three used weights were confirmed loaded in Chromium.

| Token | Default size | Main role |
| --- | ---: | --- |
| `--text-xs` | 12px | Metadata, compact topic controls, dates |
| `--text-sm` | 14px | Navigation, buttons, author names and supporting copy |
| `--text-base` | 16px | Tweet text and mobile input; dialog subheads |
| `--text-lg` | 20px | Feed and empty-state headings |
| `--text-xl` | 28px | Logo, dialog title and small-phone hero |
| `--text-display` | 56px | Hero above 479px |

All six sizes use rem units. The document root is 16px. Hero line height is 1.04, moving to 1.08 below 480px. Tweet text is 1.7, or 1.6 on phones; ordinary paragraphs are 1.6. Heading tracking is tight (`-0.055em` for the desktop hero, `-0.04em` on phones), while body copy and labels use normal tracking. Rank and engagement data use tabular numbers. Paragraphs use `text-wrap: pretty`, headings `balance`. Names, handles and tweet text can wrap; no critical content is ellipsized. Inputs remain 16px on mobile.

## Layout

The spacing vocabulary declared at the root is 4, 8, 12, 16, 24, 32 and 48px. Component CSS uses these steps directly, with 6/10/14/18/20/22px optical/density adjustments where needed. `--space-1` through `--space-7` preserve the named scale for extension; existing declarations mostly use literal values.

The page has a 1540px maximum width and shared alignment edges. Above 1239px the main shell uses 44px inline gutters, a 200px sidebar and a 32px gap. The hero spans the main area; below it the feed shares space with a 270px supporting rail and a 32px gap. Content columns always use `minmax(0, 1fr)` so real text can reflow. The sidebar is sticky at 24px, while the header and feed scroll normally.

| Viewport | Implemented adaptation |
| --- | --- |
| 1440px and up | Hero image is 77% wide, copy starts at 36px |
| 1061–1239px | 28px shell gutters, 176px sidebar, 230px rail, 24px gaps |
| 760–1060px | Supporting rail hidden; feed takes the main column |
| 480–759px | Sidebar replaced by in-flow three-item navigation, 20px page gutters; hero minimum 234px |
| 360–479px | 16px gutters; 28px hero heading and 184px minimum hero; compact controls; hero copy dictates actual height |
| 320–359px | 12px gutters, tighter card insets and icon spacing |

Headers can wrap for text enlargement. Directional spacing uses logical CSS properties. Decorative hero/media containers clip artwork; tweet text and author identities remain readable. The feed has `scroll-margin-top: 24px`; the skip link targets its focusable section. The modal is at most 540px wide and fits within `100dvh` with its own vertical scroll. Toast placement accounts for the bottom safe-area inset.

Chromium screenshots and overflow checks cover 320, 390, 760, 1060, 1280 and 1440px. See validation for precise limits: these are browser viewports, not physical-device sessions.

## Elevation & Depth

The interface is predominantly flat. Cards use one structural border with tonal backgrounds and no shadow. The selected first-ranked card has a stronger border; it does not float above other cards. The toast alone uses a soft `0 6px 24px #0006` shadow and no border. The modal uses the browser top layer, a dark translucent backdrop and 6px backdrop blur. Images use a subtle white outline. There are no nested card surfaces.

## Shapes

Cards and the ecosystem link use 10px corners; the hero uses 14px, reducing to 10px on phones. Buttons/search use 8px, topic and icon controls 6px, small counts 4–5px, the toast 9px and the dialog 16px. Author avatars are circular. The frog favicon has a rounded square silhouette. Preserve the compact rectangular controls rather than turning the interface into pills.

## Components

- **`PostCard` (`src/App.tsx:98`)** receives a post, saved state and save/share callbacks. It renders the global rank, author/profile link, date, attributed text, excerpt marker, original-post link, read-only engagement, bookmark and share actions. The first global rank gets the featured style even if sorting changes. Saving uses `aria-pressed` and a filled bookmark; counts are not fake like buttons.
- **Feed controls (`App`, `src/App.tsx`)** combine a visibly labeled search field, native sort select and a topic button group. Topic selection uses `aria-pressed`; navigation uses `aria-current`. Dynamic result counts have a polite status region. Search and categories combine; the empty state names the query and has a working reset. Show-more reveals six further posts at a time.
- **Buttons and links (`src/styles.css`)** use `.button`, `.button-primary`, `.text-button`, `.text-link` and `.icon-button`. The hero has the one lime primary action; neutral controls carry secondary actions. Use anchors for navigation and native buttons for state changes. External links open separately with `noopener noreferrer`.
- **Search (`.search-field`)** has a visible Search label, 16px mobile input and a clear action. A 2px outline on the container replaces the input ring when focus is visible. Placeholder text is an example, not the only label.
- **Native dialog (`App`, `.dialog`)** switches between the About/source view and manual share fallback. Opening moves focus to Close; Tab/Shift+Tab wrap over currently rendered controls; Escape/backdrop/Close dismiss it and restore trigger focus. The background is made inert by `showModal()`. Long source lists scroll within the dialog.
- **Local bookmarks (`loadSaved`, `savePost`)** use `pond.saved.v1`. Blocked storage produces an explicit session-only notice; malformed stored JSON safely resets. Cross-tab storage events refresh the saved state. There is no account or remote synchronization.
- **Feedback and empty state** use a stable polite announcement region and a dismissible visible toast. Toasts do not expire on a timer. Clipboard denial offers an exact selectable original URL. An empty Saved view links back to top tweets. Feed data is local, so there is no network loading skeleton or fictional pending feed state.
- **`Icon` (`src/icons.tsx`)** uses one set of current-color inline SVG paths at 1.7px stroke. Decorative icons are hidden from accessibility APIs; icon-only controls have explicit accessible names. Do not add a second icon library.

Hover styles only apply to hover-capable devices. Background/color/transform transitions are 150ms, with a `scale(0.96)` pressed state. These are enabled only under `prefers-reduced-motion: no-preference`; there is no autoplay or continuous animation.

## Do’s and don’ts

Start new reading views from the existing shell and feed pattern. Reuse the six type tokens, three weights, evergreen surfaces and lime primary style. Keep data labels, dates and source URLs attached to the post they explain. Use actual captured data and disclose its scope. Keep the mobile hero compact enough to preserve the first tweet and its controls.

Do not add live badges, invented metrics, remote fonts, unrequested wallet controls or extra promotional slogans. Do not hide long author names or source URLs to make a row fit. Adding a post means updating `src/posts.ts`, its provenance, the local avatar if necessary and the capture date, then rebuilding and rerunning validation. Adding a second page should use a hash view and reuse the existing navigation, controls, dialog and tokens so static subpath hosting keeps working.
