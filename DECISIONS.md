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

**And it answers in the lead's own instrument.** Its own timbre was tried, then
quietened, and was still heard as a second tune running alongside the first.
Quietening a voice does not stop it being a separate voice: after simultaneity,
timbre is the strongest cue the ear splits streams by. *Cost, accepted:* a
multiclass character no longer has an instrumental colour of its own.

*Decided by ear on the A/B page, 2026-08-22* — the first question that page
answered. Worth recording how it went: the timing measure had flagged Ogrim at
0.67 and the ear agreed, but the fix that worked was not the one the number
suggested. The number said "these parts move independently"; the cure was to
stop them sounding like two players, not to stop them moving. A measure points
at a symptom, and the symptom is not the mechanism.

**Every theme is levelled to the same peak.** A quiet character should sound
quiet in its own shape — soft attacks, a thinner band — not by arriving at a
lower volume, which reads as a worse recording rather than as a quieter person.

*Removed:* the gong. It stopped being an ending and became an event of its own.

## The question itself

**The prototype exists to answer one thing: is the map audible.** Given a theme
and no name, can a listener tell whose it is? Everything else — the builder, the
links, the accounts, the feed — waits on that answer.

**It went unasked for five rounds, and that was my failure.** The work in those
rounds was real — two tunes at once and a veil in the low mids would have
spoiled any test — but each step followed so obviously from the last that
nobody checked the direction. Kenny stopped it with "I am no longer sure what we
are aiming at", which was the correct thing to say and should not have had to
come from him.

*How to apply:* clearing faults is preparation, not progress. When a round ends,
say which question it moved, and if the answer is "none", say that instead.

**First result, 2026-08-22: 5 of 10.** Chance is 2.5, so it is double chance —
and it settles nothing. Pure guessing reaches five or better once in thirteen
tries (p = 7.8%). Encouraging, not evidence.

*What that means for the plan:* the answer is neither yes nor no yet, so nothing
downstream is unblocked, and ten more rounds are worth more than any amount of
further polishing. Runs now accumulate across sittings and the page reports the
probability of the running total arising by luck. Twenty rounds at this rate
would reach 1.4%, thirty would reach 0.3%.

*This result belongs to the version before the register ceiling.* The run itself
turned up the fault, so the sound changed immediately after it; the tally starts
from the corrected version. Sound must not change in the middle of a run.

**The melody had no ceiling, and one run of the test found it.** Kenny reported
the `small` tag squeaking. It was worse than one tag: nothing bounded the
absolute pitch of the melody at all. Rolled at random, one theme in five put its
melody above C7 and the worst reached A8. Two things push it up at once — a
motif that reaches down is *lifted* by however far it dips, and a wide-leap
character also reaches further up from wherever it was lifted to — and both grow
with the same parameter, so they compound.

The 418 checks never saw it, because the only pitch check bounded the melody's
*span*. A melody can be perfectly narrow and still be far too high.

Fixed with a ceiling on the whole band at once — moving every part by the same
octaves keeps bass under pad under melody, and an octave is the one
transposition the ear hears as the same music. `small` also drops from +12 to
+7: height and depth are not symmetric, and an octave up reads as shrill long
before it reads as small. Median top fell from 89 to 87, the 90th percentile
from 103 to 94, the worst from 117 to 96.

*Guarded by rolls, not by presets.* Twelve chosen examples could not have found
this; the checks now roll two hundred strangers.

**Rolled characters, not the presets.** The twelve on the front page have been
heard so many times that recognising one measures memory. A stranger cannot be
remembered, and it also tests what the rules do rather than what was chosen for
display.

**The four sheets in a round differ in class and in race.** Otherwise a round
can turn on two characters the rules could not possibly separate, and the score
measures the dice. Alignment and the tags are left where they fall — they are
meant to be audible too, and constraining them would flatter the result.

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

**A suite is audited by breaking things, not by counting them.** `./dev.sh
mutate` breaks the code one specific way at a time, runs the checks against the
broken build and records which assertions go red. A check nobody can make fail
is worse than no check, because it is counted.

What the first audit found:

- one assertion written as `check(name, true, detail)` — a print wearing a
  check's clothes. Removed.
- four deliberate breaks that nothing noticed at all.
- **the root cause of all four, and of the squeaking melody before them: the
  checks were aimed at twelve chosen characters.** Set the note-length floor to
  a hundredth of a second and every preset still passes, because none of them
  ever reaches it. The invariants are now asked of two hundred strangers as
  well, at the worst roll rather than at a favourite — and every break is caught.
- 432 passing lines were 47 distinct assertions repeated. Passes are collapsed
  to one line each now; failures keep every word. The count says
  "N assertions over M runs" rather than pretending to be N × M.

**The strangers are seeded, not rolled fresh.** A bound set from what random
characters happen to reach is a bound an unlucky run will cross, and a check
that reddens now and then for no reason stops being read. The same two hundred
every time means a number that moves is the code moving.

**Degrees are answered on the A/B page, not guessed.** "Soften it, but only a
little" costs a whole round if I pick the number. Two or three amounts on one
timeline, and the answer is a letter.

**Timestamps.** "The flute tears at 0:22" names a bar, and a bar names a line of
code. That is why the player shows the whole length and can be moved through.

**A test that varies two fields cannot say which one was heard.** The headline
round differs in class *and* race by construction, so a wrong pick differs from
the truth in both. It answers "is the map audible" and it cannot answer "which
half of it is audible" — and the second question is the one that decides where
the mapping gets rebuilt.

*My error, recorded so it is not repeated:* I proposed logging which option was
picked, and Kenny agreed to it, before I had read `draw()` closely enough to see
that the pick could not carry the answer. Reading the code came after proposing
the plan; it should have come first.

`blind.html` now has three modes. **Class only** and **Race only** are
diagnostics: four sheets that are one character with a single field swapped,
everything else held still. The class rounds carry no subclass and no second
class — a bare class is the commonest character there is, and it is the only way
to hear a class rather than a pair of them. **Each mode keeps its own tally**,
because a diagnostic asks an easier question and folding it into the headline
total would inflate the one number this repository exists to produce.

Whichever diagnostic scores worse names the weaker channel, and that decides
whether the instruments stay with the class or move to the race.

*Guarded:* `.dev/verify-blind.js` asserts that exactly one field varies. The
first version of the selector borrowed the language switch's class and was
silently un-pressed by it on every draw — a screenshot caught it, no check did.
There is a check now.

---

## Open

**Four classes are almost never heard alone.** `rollCharacter` gives a subclass
at 55% and a second class at 20%, leaving a quarter of characters bare. But
`fighter`, `monk`, `sorcerer` and `artificer` have no subclasses defined, so the
first branch cannot fire and **75% of them roll a second class** instead. Those
four are heard fused with another class three times out of four, in the headline
test and in any future genre round alike.

Found while answering Kenny's observation that I kept assuming a multiclass or a
subclass when a character may have neither. He was right about the assumption,
and the roll turns out to share it.

Not fixed yet: changing the distribution changes what the test samples, and the
headline tally accumulates across sittings. It is a decision, not a typo.

**Both diagnostics came back at chance, 2026-08-25. Class only 2/10, race only
2/10** — chance is 2.5, and P(≥2 of 10) is 76%, so neither result is
distinguishable from guessing. Kenny's own reading: earlier scores came from the
whole sheet at once, not from any one field. The measurements agree with him.

*What was measured, and what it does and does not show.* Swapping one field and
comparing note events (track, onset, pitch) gives: class 0.98, race 0.96, traits
0.96, looks 0.94, alignment 0.55, seed alone 0.20 — where 1 means no shared
events. **These numbers are brittle and must not be read as loudness of effect:**
a global shift of tempo or register moves every event and scores near 1 while
sounding almost the same. The ranking is informative, the magnitudes are not.
A perceptual measure would need features — tempo, register, density, brightness —
not note identity.

*What is solid.* Over 30 rolls of one class with the class held fixed, the motif
comes out **12 to 25 distinct** — essentially never twice the same — while the
lead instrument is **always the same one**. That is not a fault: a class owns a
*family* of motifs by design, and the comment saying so is explicit about why a
single stored melody per class would make the generator feel like a menu.

*So why is it at chance.* The class's signature is real but it is either
**statistical** (allowed intervals, contour, reach) or **arbitrary** (this
instrument means wizard). A statistical signature cannot be extracted from one
hearing of forty seconds. An arbitrary one has to be learned first, and the test
teaches nothing. An untrained listener scoring at chance is therefore the
*expected* outcome of the current design, not evidence that the arrangement is
poor.

*Why this argues for the genre plan.* A genre is the opposite of both: gross,
categorical, and already learned by every listener before they arrive. It is the
one kind of signature that needs no training round.

*And a prerequisite it exposes.* Whatever swamps the class signature now will
swamp a genre too. Before the genre work can be judged, the dressing has to stop
rewriting the theme — measured with a perceptual yardstick, not this one.


**Which part of the background is in the way.**

Asked for the background "a little louder", I offered +2, +4 and +6 dB and none
of it was audible. Measurement said the versions really did differ, so the ear
was not at fault: turning the background *off completely* changes the mix by
about 9 dB and +6 dB changes it by about 11. Two edits that far apart in intent
and that close in effect mean level is the wrong knob.

The calibration round that followed — silence against a deliberate excess —
returned something better than a yes or a no: **without the background the music
was cleaner and more pleasant.**

Measurement agrees and says where. The pad adds about a decibel between 240 and
480 Hz and nothing anywhere else, on every character measured. That band is
where sound piles up without being heard as anything: too low to carry a tune,
too high to be the bottom, and crowded already by the lower harmonics of
everything above it. Filling it does not add a part, it adds a veil. Now
measured every run as `mud`.

*Flaw in my own experiment, recorded so it is not repeated:* the version that
won removed **two** parts, the pad and the race's instrument, so it did not say
which. The current round changes one at a time.

*Prediction made before listening, and confirmed:* the pad is the culprit and
the race's instrument is not. The measure earned its keep — it named the guilty
part before anyone listened, and the ear agreed.

**What the pad was carrying, and why it cannot simply go.** Asked what breaks
without it, the checks answered:

- the final chord drops from four-to-seven parts to **two**, on every character.
  The pad *is* the chord in "the ending lands together".
- three characters stop growing at all, 3 > 3 > 3 > 3, because the pad was the
  only part entering at the build phrase.

So the fault is not that the pad exists. It is that it sounds *all the way
through*, in the worst band to sound all the way through in — and this project
already holds that nobody plays all the way through. The pad was the one part
that never left.

*Measured, before the next listen:* sounding the pad only at phrase starts and
on the final chord recovers most of the cleanliness of removing it (Ilsabet
0.571 → 0.539 against 0.523 with no pad at all) while the ending and the growth
stay exactly as they were. Lifting the pad up out of the band instead is
unreliable — it helps on Ilsabet, does nothing on Nymeria and is *worse* than
today on Marrow.
