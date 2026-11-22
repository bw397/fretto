# CLAUDE.md

Fretto is a mobile-first guitar practice app: Bun + React 19 + TypeScript, no other runtime dependencies. All rendering (fretboard, staff, clef) is hand-written SVG; all styling is in one CSS file.

## Commands

```bash
bun dev                 # dev server with HMR (src/index.ts serves src/index.html)
bun test                # unit tests (*.test.ts next to the code)
bun run typecheck       # typecheck (runs `bun check`)
bun run build           # production build to dist/ (gitignored)
```

Run the tests, typecheck and build after every change.

## Layout

- `src/lib/`: pure logic, no React except small hooks. This is where tests live.
  - `music.ts`: pitches, tuning, spelling, staff positions, ledger lines
  - `keys.ts`: major and natural-minor keys, key signatures, key-trainer rounds
  - `scale.ts`: lays a one-octave scale out on the fretboard from a tapped root
  - `intervals.ts`: interval names and interval-trainer rounds
  - `drill.ts` / `scaleDrill.ts`: String Drill and Scale Drill logic
  - `score.ts`: per-screen score and streak store (`useScore`)
  - `screenState.ts`: `useScreenState`, which is `useState` that survives screen switches
  - `scroll.ts`: auto-scroll helpers for the practice screens
- `src/components/`: reusable UI: `Fretboard`, `Staff`, `Menu`, `RoundResult`, `ScoreDisplay`, `Segmented`, `FretRangeToggle`, `HeaderSlot`
- `src/screens/`: one component per screen, registered in `src/screens/index.ts`
- `src/index.css`: all styles; CSS custom properties with light and dark palettes

## Music conventions (read before touching music code)

- **Pitches are MIDI numbers**, C4 = 60. "Sounding" pitch is what the guitar plays.
- **Guitar is written an octave above sounding pitch** (treble clef with an 8 below). Anything shown on a staff uses `writtenMidi` = sounding + 12. Mixing these up is the easiest bug to introduce.
- **Strings are indexed 0 = high e … 5 = low E** (`STANDARD_TUNING`, `STRING_NAMES`). The fretboard draws string 0 at the top.
- **Staff positions are diatonic indices**: `octave * 7 + letterIndex` (C = 0 … B = 6). The bottom line E4 is 30 and the top line F5 is 38.
- **Spelling matters.** Keys are spelled one letter per scale degree (F major has B♭, F♯ major has E♯). Use `buildKey` / `KEYS`, `staffPositionInKey` and `noteAtPosition` rather than deriving names from pitch classes. `KEYS` has exactly one key per tonic pitch class per mode (up to six sharps or flats).
- **Frets go 0 to `MAX_FRET` (12).** The "Frets 0–5" toggle limits where questions are generated, not where the user may tap.

## Screens

Screens are listed in `SCREENS` (`src/screens/index.ts`) with an `id` (the URL hash, e.g. `#/key`), a `title` and a `category` (`"Practice"`, `"Drills"` or `"Reference"`); the menu groups them by category. The first screen is the default. Routing is hash-based on purpose: it works on GitHub Pages with no server rewrites, so don't switch to path-based routing.

A screen is unmounted when you leave it, so:

- **Any state that should survive switching screens must use `useScreenState("<screen>.<name>", initial)`**, not `useState`. That includes the current question and answers on trainers, and every input on reference screens. Prefix keys with the screen id.
- Scores go through `useScore("<screen id>")` and are shown with `<ScoreDisplay>`, which portals into the sticky header.
- Both stores are in memory only and reset on page reload.

### Practice screen pattern

The trainers (`SingleNoteTrainer`, `KeyTrainer`, `IntervalTrainer`) follow the same shape. Keep new trainers consistent:

- A `FretRangeToggle` at the top. Changing it starts a new question.
- Steps the user answers in any order; answers stay editable until submitted.
- `ready` = every step answered; `submitted` (persisted) = Check answer pressed. Call `record(ok)` once, in the submit handler, never on render or on mount.
- `<RoundResult ready submitted onSubmit correct nextLabel onNext>` at the bottom: a Check answer button, then the message and Next button. It handles scrolling to itself, focusing Next and scrolling to the top on Next.
- `useScrollTo(ref | null)` brings the next unfinished step into view. It doesn't scroll on mount, so returning to a screen doesn't jump.
- After submitting, correct answers are green, the user's wrong answers are greyed, and the correct answer is shown in red (`tone` props on `Fretboard` markers and `Staff` notes).

### Drill screen pattern

Drills (`StringDrill`, `ScaleDrill`) are for fast repetition: no Check answer button and no `RoundResult`. A tap is graded immediately: `record(ok)`, then the persisted progress and question advance at once. The answered question and its right/wrong markers are held in local (non-persisted) `feedback` state for about a second and shown in place of the new question. Advancing at once means leaving mid-feedback can't let the same question be answered twice. `Fretboard`'s `focusString` prop highlights one string and limits taps to it.

## UI conventions

- Design for a ~390px-wide phone first. Check narrow widths when adding header text or hints (`.hint` doesn't wrap).
- Keep layouts compact so a whole question fits on a phone screen: spacing comes from `--gap` (between cards) and the card padding, so tighten those rather than shrinking tap targets (44px menu button, 44px-tall note options, 38px toggles).
- The screen title is shown in the sticky header (from `SCREENS`). Screens don't render their own `<h1>`; a screen just starts with its content.
- Colours come from CSS variables in `:root`, overridden under `prefers-color-scheme: dark`. Don't hard-code new colours in components.
- `Fretboard` and `Staff` are SVG with fixed viewBoxes that scale to the container width. Coordinates are in viewBox units.
- Respect `prefers-reduced-motion` (see `scroll.ts` and the media query at the end of `index.css`).

## Checking changes in a browser

Use Playwright from a scratch directory, not as a project dependency. The installed browser build may not match the Playwright package version, so point `executablePath` at the Chromium under `~/.cache/ms-playwright/chromium_headless_shell-*/`. Use a phone viewport (e.g. 390×667 at deviceScaleFactor 2). On short viewports, scroll the staff or fretboard into view before clicking it by coordinates.

Start the dev server as a background command (`PORT=3417 bun src/index.ts`) and stop it in a separate command with `pkill -f "^bun src/index.ts"`. A plain `pkill -f "bun src/index.ts"` also matches the shell running it, killing that whole command.

## Deployment

`.github/workflows/deploy.yml` tests, builds and publishes `dist/` to GitHub Pages on every push to `master`. The site is served from a `/<repo>/` subpath; this works because the build emits relative asset paths and routing is hash-based. Keep both true.

## Docs

The README lists every screen and how it works. Update it when adding or changing a screen.
