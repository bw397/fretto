# fretto

A mobile-friendly guitar practice app. Bun + React.

## Screens

Open any screen from the hamburger menu (top right). The menu groups screens into **Practice** and **Reference**. Each screen has its own URL hash (e.g. `#/single-note`).

### Practice

- **Single Note Trainer** (the default): a random note is fretted on the fretboard. Pick its name, then tap or drag to place it on the staff. Once you've given both answers, the app checks them and shows the correct note in red if you got either one wrong.
- **Key Trainer**: a random major or natural-minor key (up to six sharps or flats), its root and three other notes from the key. The root is shown at a random spot on the fretboard. Tap the fretboard to find the other three notes (any matching spot counts; tap a marker to remove it). Then write each one on the staff, in the octave you tapped on the fretboard. The staff shows the key signature.

- **Interval Trainer**: four intervals (e.g. third, fifth, minor third, seventh) and a random root on the fretboard. Tap where each interval is: the nearest one above the root (within an octave), on any string. Tap a marker to remove it. Wrong answers show the nearest correct spot in red.

All three trainers have a Frets 0–5 / Frets 0–12 toggle that limits where notes are picked from.

### Reference

- **Scale**: choose major or minor, then tap any spot on the fretboard to set the root (shown in yellow). The fretboard fills in one octave of the scale, up to the next root. Notes never go below the root's fret. Each one goes in the four frets starting at the root where possible (one finger per fret), then a one-fret stretch, then further up the neck, always at the spot nearest the note before. The staff below shows the scale ascending, with its key signature.
- **Staff**: pick a key, then tap the staff to write up to 8 notes (one per column; tap a note again to remove it). Each note's name, with the key signature applied, shows underneath. Changing the key keeps the notes and renames them.

To add a screen, create a component in `src/screens/` and add it, with its category, to `SCREENS` in [src/screens/index.ts](src/screens/index.ts).

## Notation

The staff uses guitar notation: treble clef with an 8 below, written one octave above the sounding pitch. Low E open (E2) is written E3, below the staff. Sharps and flats count either way: a C♯ is accepted on the C position or the D position.

## Development

```bash
bun install
bun dev        # dev server with HMR
bun test       # music-theory unit tests
bun run build  # production build to dist/
```
