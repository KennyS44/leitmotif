# Decisions

What has been settled, and why. Everything here was worked out by listening and
arguing about it, and almost none of it can be recovered from the code — the
code shows what is done, not what was tried and rejected first.

It lives in the repository because a conversation does not survive: context gets
compacted, a session ends, and the same rejected idea comes back a week later
dressed as a new one. Appended each round, newest at the bottom.

Rules for this file: a decision, the reason, and — where there was one — the
thing that was tried and did not work. No entry without a reason.

---

## The shape of a theme

**A theme is a motif and a cell, and everything else dresses them.**
The motif comes from the class: a few scale steps, stated, answered, turned and
brought back. The cell comes from the race: one bar of rhythm that every part
takes its onsets from.

*Rejected:* a melody assembled note by note from tuned statistics. It was built
and it was unmemorable — nothing in it ever came back, so there was nothing to
hold on to. Repetition is not a shortcut; it is the mechanism.

**One grid for every part.** Melody, bass and kit land on the same cell, so they
sound like a band rather than three processes sharing a room.

**Alignment picks the mode, and the one degree that mode bends.** A theme that
never sounds its mode's colour note is in that mode on paper only, so every
theme lands on it once a phrase. Plain major bends nothing, and gets a suspended
chord and a pedal bass instead of a colour.

**Nobody plays all the way through.** Parts enter and leave at phrase
boundaries: melody and bass alone, then chords, then everything leaning into the
third phrase, then the full return. Open any arranged song in a sequencer and
most of the grid is empty.

## The band

**Instruments are chosen for each other, not one at a time.**
Each voice has brightness, attack, cut and family; the accompaniment's level and
brightness ceiling are computed from the pair that actually met.

*Rejected:* fixed levels (counter 0.62, colour 0.50) and a single rule of "do
not repeat the lead". Both are rules about *difference*, and difference is
exactly what makes an ensemble fall apart into soloists. A bell at 0.50 is
louder than a choir at 0.50, and a harp behind a brass paladin is not the same
harp as behind a choir cleric.

**Nothing accompanying may be brighter than the melody.** Whatever is brightest
in a mix gets promoted by the ear into the tune. Anything over the lead has its
top rolled off, by an amount proportional to how far over it is.

**The race's instrument doubles the melody's accents, an octave down, at the
same instant.** Same notes at the same moment fuse into one timbre; different
notes at different moments split into two lines. It used to play the bar's chord
tones on every accent in three phrases out of four — which is, by construction,
a second melody. Kenny heard exactly what was written.

**It comes and goes.** An instrument present in every bar is a part; one that
arrives for a moment is an accent. Quiet characters get it only on the final
chord — one note in the whole theme.

**The second class answers in the melody's silences and joins it on the
cadence.** Speaking in every bar turned "and also a rogue" into a rogue playing
a different song.

**Every theme is levelled to the same peak.** A quiet character should sound
quiet in its own shape — soft attacks, a thinner band — not by arriving at a
lower volume, which reads as a worse recording rather than as a quieter person.

*Removed:* the gong. It stopped being an ending and became an event of its own.

## How we work

**Complaints are turned into numbers** (`metrics.js`), so a fix can be checked
before it reaches Kenny rather than after. No number says "this is good"; they
say "this is still the thing you objected to", which is enough to stop a fix
that fixed nothing from being shipped as one.

*Correction, first run:* the first version of the two-tunes measure counted any
note that did not strike with the melody, and failed the second class for
answering in the gaps — which is the very thing that fuses two voices. Rivalry
is *overlapping while moving independently*, not *not coinciding*.

**Checks come at two levels.** The score costs milliseconds, the audio costs
minutes, and nine tenths of what breaks is visible in the score. `./dev.sh
check` after every edit; `--full` once, before publishing.

**Every part performs from its own stream of randomness.** The jitter that keeps
the playing from sounding mechanical used to be drawn from one shared stream,
handed out in track order. Deleting the second voice's notes therefore shifted
every draw belonging to the pad, the bass and the drums: the whole band was
re-performed from the first bar.

*Found by:* the first real use of the A/B page. Version C ("without the second
voice") differed from A from second zero, although the second voice does not
enter until 9.9s. Two things were changing when one was meant to — and worse,
any edit to a note count had been quietly reshuffling the feel of everything
below it, round after round. Guarded now by a check.

**An A/B page must show where the versions differ.** The first time it was used,
all three versions were switched between inside the opening seconds — where they
are identical, because the part in question had not entered yet. The answer that
came back was "no difference", and it was correct about the passage being
listened to. The timeline now carries a map of where the versions part company,
measured after fitting out any difference in level (a change of loudness is not
a change of music), and the head is parked just before it.

**Degrees are answered on the A/B page, not guessed.** "Soften it, but only a
little" costs a whole round if I pick the number. Two or three amounts on one
timeline, and the answer is a letter.

**Timestamps.** "The flute tears at 0:22" names a bar, and a bar names a line of
code. That is why the player shows the whole length and can be moved through.

---

## Open

**Multiclass may still split into two tunes.** Measured: Ogrim's second class
overlaps the melody while moving independently 67% of the time, Pip's 22%. The
second class was quietened last round, not removed — and quietening a voice that
keeps its own timbre does not stop it being a separate voice.

On the A/B page now: keep it as it is, give it the lead's instrument, or drop it
altogether. The third is a measurement, not a proposal — if nothing is missed,
it is not needed.
