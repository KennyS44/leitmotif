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
| `characters.js` | six presets, chosen to sit far apart |
| `i18n.js` | Russian for the prototype; English is the default and the fallback |
| `app.js` | the page: play, stop, language switch, export to MP3 |

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

`node test.js` against the page on port 20302 renders all six themes offline and
checks 83 assertions: that a bar shape recurs and most of the theme is built
from recurring material, that every melody note and every drum hit lands on the
race's grid, that the opening phrase returns at the end, that the same sheet
gives the same score twice while one changed trait changes it, that no character
is drowned out by another, and that the page holds up at 390px.

It cannot tell whether the music is *good*. That judgement is the point of the
prototype and belongs to a human.

## Third-party code

`vendor/lame.min.js` is [lamejs](https://github.com/zhuker/lamejs), unmodified,
under the LGPL — see `vendor/lamejs-LICENSE.txt`. It is fetched only when
somebody asks for a file, so the page itself carries no dependency. Nothing else
in the project has one.

## Not here yet

Character builder, tag picker, shareable links, link previews, accounts, feed,
download limits, subscription. All of it waits on the answer to the one question
above.
