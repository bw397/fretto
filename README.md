# fretto

A mobile-friendly guitar practice app. Bun + React.

## Screens

Open any screen from the hamburger menu (top right). The menu groups screens into **Practice**, **Drills** and **Reference**. Each screen has its own URL hash (e.g. `#/single-note`).

### Practice

- **Single Note Trainer** (the default): a random natural note (no sharps or flats) is fretted on the fretboard. Pick its name from C D E F G A B, then tap or drag to place it on the staff. Once you've given both answers, the app checks them and shows the correct note in red if you got either one wrong.
- **Key Trainer**: a random major or natural-minor key on a natural root (C D E F G A B, so e.g. F major or B minor but not F♯ major), its root and three other notes from the key. The root is shown at a random spot on the fretboard. Tap the fretboard to find the other three notes (any matching spot counts; tap a marker to remove it). Then write each one on the staff, in the octave you tapped on the fretboard. The staff shows the key signature.

- **Interval Trainer**: five intervals (e.g. third, fifth, minor third, seventh, octave) and a random natural root (no sharps or flats) on the fretboard, labelled with its name. Tap where each interval is: the nearest one above the root (within an octave), on any string. Tap a marker to remove it. Wrong answers show the nearest correct spot in red.

All three trainers have a Frets 0–5 / Frets 0–12 toggle that limits where notes are picked from. Answers can be changed until you press **Check answer**; then the result and a Next button appear. The current question, your answers and your score are kept when you switch screens and are saved in the browser (IndexedDB), so they're still there after a reload or when you come back later. So are the reference screens' inputs and the screen you were on. Each score counts up to 999 questions, then starts again from 1.

### Drills

Quick, single-focus repetition with instant feedback (no Check answer button).

- **String Drill**: a natural note name (A to G, no sharps or flats) and a fretboard with one string highlighted. Tap that note on the highlighted string (either matching fret counts). Right or wrong shows on the fretboard for one second, then the next note appears. Settings at the top:
  - **Frets**: 0–5 or 0–12 (default 0–12). With 0–5, only notes playable there are asked and the rest of the neck is shaded.
  - **Strings**: In order (high e down to low E, then back to high e) or Random (a different random string each time). Default: In order.
  - **Per string**: 3, 5, 10 or 20 questions before moving to the next string (default 5).

  Changing a setting restarts the count on the current string.
- **Scale Drill**: a random major or minor key, with its root shown in yellow at a spot where the whole scale fits above it (no lower than the root's fret, within fret 12). You're asked for the six other notes of the scale in random order (e.g. "E, the 3rd above the root"). Tap the note in the octave above the root, on any string. Right answers stay on the board in green; a wrong answer shows the correct spot in red for a second, then that note stays on the board. After all six, the drill shows your score for the scale and moves to a new key.

### Reference

- **Scale**: choose major or minor, then tap any spot on the fretboard to set the root (shown in yellow). The fretboard fills in one octave of the scale, up to the next root. Notes never go below the root's fret. Each one goes in the four frets starting at the root where possible (one finger per fret), then a one-fret stretch, then further up the neck, always at the spot nearest the note before. The staff below shows the scale ascending, with its key signature.
- **Staff**: pick a key, then tap the staff to write up to 8 notes (one per column; tap a note again to remove it). Each note's name, with the key signature applied, shows underneath. Changing the key keeps the notes and renames them.
- **Octaves**: every fretboard position from the open strings to fret 12, coloured and numbered by its octave (scientific pitch notation, for the note the guitar sounds: open low E = E2). A legend shows each octave's range on the fretboard, and a staff underneath shows each octave's natural notes stacked in one column, in the same colours (written an octave higher, as usual for guitar).

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
