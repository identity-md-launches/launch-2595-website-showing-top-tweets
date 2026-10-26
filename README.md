# Pond

A dark green reader for top tweets about **identity.md**, illustrated with AI-equipped Pepes. Ten sourced posts can be searched, filtered by topic, sorted by engagement/date/likes, saved in the browser and shared through their original X links.

The complete static site is in **`dist/`**. It includes every runtime image, avatar, icon and font. No backend, account, API key or wallet is needed.

## Install, preview and rebuild

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run preview
```

Open the local address printed by the preview command (normally port 4173). Preview serves the delivered export; it does not rebuild it.

```sh
npm run dev        # source development server
npm run typecheck  # strict TypeScript check
npm run build      # replace dist/ with the production export
npm run preview    # inspect the rebuilt export
```

Vite uses `base: './'`. The export has relative HTML/CSS asset paths and hash navigation, so `dist/` can be served at a static gateway subpath without rewrite rules. Serve the whole directory through HTTP, not by opening `index.html` as a `file://` URL. Runtime assets are local; X/source/profile links intentionally open external destinations. The relative Open Graph image can be made absolute after a final public origin is known.

The worker installed dependencies outside the repository and ran these scripts with external dependency resolution. The scripts also support a normal local `npm ci` install. Dependency/cache directories are excluded at every nesting level; `dist/` is intentionally retained.

## Data and behavior

This is a **snapshot captured on 26 October 2026**, not a live X feed. “Top” means highest captured `likes + reposts + replies` within these ten selected posts; it does not claim to rank all of X. Dates and metrics come from the public FxTwitter API. Longer posts show marked excerpts, retaining their authors’ wording. Every card links to the original tweet and author. The About dialog explains the ranking, sources and storage behavior. Full provenance is in [docs/SOURCES.md](docs/SOURCES.md).

Bookmarks use local storage under `pond.saved.v1`, only in the current browser. If storage is blocked, they last for the current session. Sharing copies the original post URL; if copying is unavailable, a dialog offers a selectable link. No social action changes an X count. Search, filters and bookmarks continue working offline after the page’s local assets have loaded; this is not a service-worker installation.

To refresh the snapshot, update the post records in `src/posts.ts` from the linked originals/API, keep each excerpt at most 25 words, update `snapshotDate` and `docs/SOURCES.md`, add any required avatar under `public/avatars/`, then rebuild. Never present a locally fabricated count or relative timestamp as live activity.

## Validation

```sh
npx playwright install chromium
npm run validate
npm run check:bundle
```

The interaction runner starts and stops its own local HTTP server, serves the actual `dist/` beneath `/preview/`, and writes disposable evidence to `test/scratch/validation/`. It validates search, topics, sorting, navigation, bookmarking and persistence, empty/recovery states, clipboard success/failure, keyboard dialog behavior, relative resources, responsive overflow, reduced motion, forced colors and accessibility. Install WebKit with `npx playwright install webkit` if its system libraries are available; otherwise the runner reports that coverage limitation.

Actual worker results on the final export:

- Production build and strict typecheck passed.
- **41 interaction/browser checks passed**, including a complete first tweet with read/save/share controls at **390 × 844**.
- Axe audits: **zero violations** on desktop, mobile and the open source dialog.
- Pinned design-critic probe: **16/16 checks passed**, including offline rendering at 320, 390 and 1440px.
- Export and total submission fit below the **8 MiB** budget; exact counts are in [docs/VALIDATION.md](docs/VALIDATION.md).

WebKit launch was attempted but required system libraries were missing, so Safari remains unverified. Screen-reader sessions, physical devices, native browser zoom and authenticated X destinations were not tested. The results are this worker’s observations, not an independent certification.

See [DESIGN.md](DESIGN.md) for implemented tokens/components/responsive behavior, [the consolidated review](docs/VALIDATION.md) for all six Better Interface domains, [screenshots](docs/evidence/) for rendered evidence, and [attribution](docs/ATTRIBUTION.md) for artwork, posts, fonts and guidance licenses.
