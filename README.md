# Leitmotif — mapping prototype

A theme for a D&D character, generated in the browser from the character sheet
alone. No server, no samples, no account.

**Listen:** https://kennys44.github.io/leitmotif/

This repository is **step one of the project, not the project**. The only
question it exists to answer is whether the mapping is audible: given six
characters that differ on every axis, can a listener hear which is which? The
interface, the character builder, the accounts and the feed all come later, and
only if the answer is yes.

## How it is put together

| File | Job |
|---|---|
| `mapping.js` | character sheet → musical parameters. The whole idea of the project lives here |
| `music.js` | parameters → a score, and a score → sound. Knows nothing about D&D |
| `render.js` | sheet → an audio buffer, in one place, so both pages make sound identically |
| `player.js` | one thing sounds at a time, and whatever sounds can be moved through |
| `characters.js` | twelve presets, chosen to sit far apart |
| `i18n.js` | Russian for the prototype; English is the default and the fallback |
| `app.js` | the front page: play, stop, language switch, export to MP3 |
| `labels.js` | which language the site is in, and how a character sheet is read out |
| `blind.js` | the blind test: the one question this repository exists to answer |
| `compare.js`, `variants.js` | the A/B workbench, and the versions it puts side by side |
| `metrics.js` | recurring complaints turned into numbers. A test instrument — the site never loads it |
| `DECISIONS.md` | what has been settled and why, including what was rejected |
| `dev.sh` | serve, check, publish |

The split is deliberate. The synthesiser can be replaced without touching the
character logic, and the character logic can be re-tuned without breaking the
sound.

## Motif and cell

Two things carry the identity of a theme, and everything else dresses them.

The **motif** comes from the class: a handful of scale steps that is stated,
answered, turned and brought back, never re-invented. Repetition is how music
becomes memorable — a melody assembled note by note from well-tuned statistics
cannot be remembered, because nothing in it ever comes back.

The **cell** comes from the race: one bar of rhythm, eight slots, accents
marked. The melody takes its onsets from it, the bass plays its accents and the
kit plays all of it. One grid for every part is what makes them sound like a
band rather than three processes running side by side.

Over the top sits a form — four phrases, **A A' B A''** — so that forty seconds
has a shape and not merely a length.

| Field | Owns |
|---|---|
| Class | the motif, and the instruments that play it |
| Second class / subclass | a short fork off the motif, in a second voice |
| Race | the rhythmic cell, register, articulation |
| Alignment | mode and harmonic tension |
| Traits (up to 5) | how full the cell is, how wide the motif reaches, dynamics |
| Looks (up to 5) | register, timbre, room |

Required fields set the shape; optional tags only colour it, at 60% weight, so
no single tag can turn a paladin into a bard. Motifs and cells are **chosen,
never blended** — averaging two motifs gives a third belonging to nobody.

## Determinism

The same sheet always produces the same theme, on any machine. Every random
choice is drawn from a generator seeded by a hash of the character. That is what
will let a shared link play the tune the sender heard, and it is why the feed can
one day store a two-kilobyte recipe instead of a multi-megabyte recording.

## Tests

`./dev.sh check` starts the server if it is not up and runs the checks. Two
levels, because they cost very different amounts:

- **the score** — seconds. Structure, grid, layers, form, blend, the endings,
  the page at 390px, and every complaint measure that needs no audio. Run after
  every edit.
- **`--full`** — minutes. All of that, plus rendering each theme to samples:
  loudness, clipping, brightness, warble, and that the same sheet performs the
  same way twice. Run once, before publishing.

Nine tenths of what can break is decided in the score and shows up instantly.
Paying for twelve audio renders to discover that a bar line moved was most of
the cost of a round.

`metrics.js` turns the complaints that keep recurring — *several tunes at once*,
*mechanical*, *ragged*, *warbling* — into numbers, so a fix can be checked
before it is shown to anybody. A finding that is real but not yet decided is
printed as **open** rather than passed or failed: it holds at no worse than the
number it was recorded at, and fails if it slips.

None of this can tell whether the music is *good*. That judgement is the point
of the prototype and belongs to a human — which is what `compare.html` is for:
two or three versions of one edit on a single timeline, so the answer is a
letter instead of an essay.

## Third-party code

`vendor/lame.min.js` is [lamejs](https://github.com/zhuker/lamejs), unmodified,
under the LGPL — see `vendor/lamejs-LICENSE.txt`. It is fetched only when
somebody asks for a file, so the page itself carries no dependency. Nothing else
in the project has one.

## Answering the question

`blind.html` is the test the question above deserves. A theme plays with no name
on it and four sheets are offered; ten rounds; chance is two or three right.

Two things make it a test rather than a demonstration. The characters are
**rolled fresh, never the twelve presets** — those have been listened to so
often that picking one out of a line-up would measure memory rather than
mapping. And the four sheets in a round always **differ in class and in race**,
so no round is decided by a coin toss between two characters the rules could not
separate. Alignment and tags are left where the dice put them: they are supposed
to be audible too, and rigging them would flatter the result.

Everything else in this repository — every fix to the arrangement, every round
on the A/B page — is worth exactly what this test says it is worth.

## Not here yet

Character builder, tag picker, shareable links, link previews, accounts, feed,
download limits, subscription. All of it waits on the answer to the one question
above.
