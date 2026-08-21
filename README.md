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
| `app.js` | the page: play, stop, export to WAV |

The split is deliberate. The synthesiser can be replaced without touching the
character logic, and the character logic can be re-tuned without breaking the
sound.

## The rule that keeps it audible

Every field of the sheet owns a **different** musical axis. If two fields both
pushed on tempo, their changes would cancel and the user would hear nothing when
editing either one.

| Field | Owns |
|---|---|
| Class | the instruments — who is playing |
| Second class / subclass | a counter-melody voice |
| Race | rhythm, register, ornament |
| Alignment | mode and harmonic tension |
| Traits (up to 5) | how the melody moves — loud or quiet, smooth or jagged |
| Looks (up to 5) | timbre and room |

Required fields set the shape; optional tags only colour it, at 60% weight, so
no single tag can turn a paladin into a bard.

## Determinism

The same sheet always produces the same theme, on any machine. Every random
choice is drawn from a generator seeded by a hash of the character. That is what
will let a shared link play the tune the sender heard, and it is why the feed can
one day store a two-kilobyte recipe instead of a multi-megabyte recording.

## Tests

`node test.js` against the page on port 20302 renders all six themes offline and
checks the structure, the determinism, the audio itself and the layout at 390px —
44 assertions. It cannot tell whether the music is *good*; that judgement is the
point of the prototype and belongs to a human.

## Not here yet

Character builder, tag picker, shareable links, link previews, accounts, feed,
download limits, subscription. All of it waits on the answer to the one question
above.
