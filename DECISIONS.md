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

## Genre

**A class is dressed in a genre, because a genre is the only signature that
needs no teaching.** Settled 2026-08-26 after three rounds on the A/B page.
Baroque beat the current sound for the wizard and gypsy jazz beat it for the
bard, on first hearing, with nothing explained beforehand.

**The genre survives the dressing.** This is the finding that made the plan safe
to scale, and it nearly went untested. The first version of the question removed
the character's tags — but the genre *sets* register, roughness and tension
outright, which are the very numbers the tags move, so on two of three
characters "no difference" was guaranteed by construction rather than observed.
An experiment with one possible answer is not an experiment. Re-asked with the
tags laid back *over* the genre, where it could fail, the answer was still that
the genre holds. Tags swamped an arbitrary signature; they cannot swamp a
learned one.

**Two rules decide which genres are available, and both are about telling
classes apart rather than about any one class being right.**

- *The palette is the budget.* Sixteen voices, six kits, two synthetic timbres.
  Three classes given three different electronic genres would produce one sound
  under three labels. Only two primaries are synth-led.
- *A genre that lives in the drum pattern cannot speak.* The cell belongs to the
  race and the genre layer does not take it. Taiko is mostly a drum pattern,
  which is why it never arrived. What a genre can say here it says through
  instrumentation, harmony and articulation.

**The barbarian round, and what it cost.** The first attempt changed the genre
*and* the lead instrument in one version — the same mistake already recorded
over the pad and the race's instrument, made again. Kenny heard "a cross between
a druid and a bard"; the bamboo whistle was the whole of it, and putting the
class's own horn back fixed it. A pastoral flute reads as druid no matter what
the drums are doing.

*Second correction from the same round:* the barbarian was also far too slow.
72 bpm is a funeral, not a rage. 124 now.

**Two presets added — a ranger and a sorcerer.** Those were the only two of the
thirteen classes no preset reached, so they could be heard only by rolling
strangers until one turned up. Fine for a spot check, useless for walking the
classes one after another, which is what choosing a genre for each of them
needs. Fourteen cards on the front page now, not twelve.

---

## The figure, and the bass

**A genre is mostly its accompaniment figure, and there was not one.** The
background laid a single chord on each bar line and held it; the bass played the
cell's accents. Both were true of every character and every genre alike, so a
baroque wizard and a bossa nova rogue had the same background lane — visible at
a glance once `plan.html` drew it. Tango is a marcato four, bossa is an off-beat
comp, baroque is a running continuo, gypsy jazz is la pompe. Given held block
chords they differ only in paint, which is what was happening.

Six figures for the background — `held` (the old one, still the default),
`pulse`, `offbeat`, `pompe`, `arpeggio`, `swell`, `none` — and five for the bass
— `accents` (the old one), `walking`, `alternating`, `pedal`, `sparse`. Density
across the presets went from near-identical to 26–216 background notes.

**The bass was the loudest thing after the tune, in one timbre, on one figure.**
Kenny: "слишком громкий и однотипный бас, который перекрывает часть другой
мелодии". All three parts of that were literally true — the bus sat at 0.80 with
no ceiling (against 0.52 for the background), and the instrument was always
`strings`, or `dark` when droning, whatever the class said. Now 0.62 with a lid
at 1100 Hz, and the genre picks its instrument.

*Guarded by:* the diagrams are generated from `composeScore`, so a figure that
stops varying shows up as a lane that stops varying, without anyone listening.

## Karplus–Strong, and the outdoor voices

**Sixteen voices, one method.** Every voice was two or three detuned sawtooths
through a lowpass, which is why they sounded like relatives however the filters
were set, and why a seventeenth would have added nothing. The palette is not
short of names; it was short of *methods*.

**Plucked strings are modelled now, not imitated.** A burst of noise in a loop
one wavelength long, losing its top on each trip. The comment beside the old
harp said this was impossible — "a delay shorter than one render block at these
pitches, which browsers will not give inside a loop" — and it is right about a
`DelayNode` in a feedback cycle, which Web Audio holds to one render quantum,
about 344 Hz. Writing the samples into a buffer has no such floor, is exactly
deterministic, and is cached per pitch, so a theme pays for a handful of buffers
rather than three hundred notes. Lute, harp and pizzicato are one algorithm at
three settings of strike and ring.

**Wind, leaves and birds.** Asked for by Kenny for the druid, and the one thing
a synthesiser can do honestly without samples: a bird is a swept sine, leaves
are shaped noise bursts, wind is a resonance drifting across a band. Pitched
from the harmony, so the forest is in the key, and given a low `cut` so the
blend rules can never promote one of them into the tune.

## The genre for each class, settled

Twelve of thirteen are chosen. The bard is still open — both candidates came
back "более резкие, а надо плавнее", so the search there continues in the
opposite direction.

| класс | жанр |
|---|---|
| варвар | балканская духовая |
| воин | классицизм |
| волшебник | импрессионизм |
| друид | минимализм / процессы |
| жрец | григорианский хорал |
| изобретатель | индастриал |
| колдун | darkwave |
| монах | минимализм дозора |
| паладин | органум |
| плут | танго |
| следопыт | барокко |
| чародей | trance / goa |

**Rejected genres are removed from the workbench, and only from there.** Five
versions to click through had made the testing longer than the listening, and
most of what was on offer was already ruled out. They stay in this file, which
exists precisely so a rejected idea cannot come back next week wearing a new
hat — and nobody has to click through a file.

*My mistake, and what it cost.* The round before this one I recorded Kenny's
verdicts and did not apply them, reasoning that a genre judged before the
accompaniment figures existed ought to be re-judged after they landed. The
reasoning was sound; not acting on it was not. He went to listen expecting his
own choices in place, found the ranger still on Nordic folk instead of the
baroque he had asked for, and spent the round working out whether he had been
ignored. **A decision recorded and not applied reads as a decision lost.** If a
verdict needs re-testing, apply it and say why it is being re-tested.

## Development inside a theme

**The figure was identical from the first bar to the last.** Giving each genre
its own accompaniment fixed one complaint and exposed the next: a theme with
four phrases repeated the same bar sixteen times underneath. Kenny on the
fighter — "однотипно на протяжении всей музыки, тут хочется слышать развитие в
каждой части" — and on the rogue, "всё ещё однотипный бас". One cause, two
reports.

"Nobody plays all the way through" was already the rule for whole parts. This is
the same rule inside a part: A states the figure plainly, A' still plainly
because that is where the background first speaks, B fills in and the bass leans,
A'' returns. Measured on the fighter, background notes per phrase went from
0 → 36 → 36 → 36 to **0 → 24 → 72 → 36**.

**A kick was a bare sine that stopped.** Reported on the warlock and the
sorcerer, and those two share the `tick` kit — where the accent answered with a
full 46 Hz kick amid five-kilohertz clicks, with nothing in between. Two faults
behind it:

- `noise()` wrote the *shared* output gain of the hit, so on any drum built from
  two layers the noise envelope silently gated the drum under it. A 55 ms
  transient would have cut a 460 ms kick to 55 ms — which is the "оборвано"
  itself. Each layer carries its own envelope now.
- the `tick` kit has its own low hit, tight and pitched up, instead of borrowing
  the kick.

**`bassDrop`.** The register clamp stops twelve semitones below concert, which
is right for a melody and not enough for fury — the barbarian came back "не
хватает более низких нот". The bass alone can now go below the clamp; it is safe
in that one direction, since the rule that matters is that the bass never climbs
over the chord above it. Its lowest note went from 40 to 30.

**The forest was too busy and too sharp.** First pass put a bird on every note
of the colour track, which is a budgerigar in a box rather than a wood. Most
notes pass in silence now, calls have their own spacing and land softer; the
leaves gained a continuous bed under the grains, and the grains rise instead of
clicking.

## The low half of the palette

**Dropping the register is not the same as being a lower instrument.** The
barbarian got `bassDrop`, came back still not furious enough, and Kenny named
the reason exactly: "более низкий по звучанию **всех инструментов**, а не только
более глубокий бас". Moving notes down leaves the timbres where they were, and a
brass band an octave lower is still a brass band playing high.

So every family now has a dark relative, modelled rather than transposed — a
tuba is not a trumpet an octave down, it has a slower attack, almost no bite,
and its energy sits under 400 Hz.

| было | стало |
|---|---|
| brass | tuba |
| strings, fiddle | contra |
| choir | basso |
| organ | pedal |
| flute, whistle | bassflute |
| lute, harp, pizz | theorbo |
| glass, bell | tamtam |
| pulse | dark, sub |

The bass track is deliberately left out: it already has `bassDrop`, and the one
part whose whole job is the bottom does not need a darker twin.

*Measured, lead-only renders against their bright counterparts, zero-crossing
rate as a stand-in for brightness:* tamtam −42%, brass→tuba −30%, strings→contra
−28%, flute→bassflute −26%, organ→pedal −24%, pulse→sub −20%, choir→basso −15%,
lute→theorbo −11%. The theorbo's number is the weakest and the measure is the
reason: a plucked string's zero-crossing rate follows its fundamental, while
what changed is how fast the harmonics die. Believe the ear over that row.

*Whole barbarian, A against B:* brightness 586 → 408 Hz, lowest note 40 → 30.

**Not done, and deliberately:** none of these voices transposes itself in
`playNote`. It was tempting — a theorbo really does sit below a lute — but a
voice that sounds an octave from where the score says would break the one rule
the arrangement rests on, that bass sits under pad sits under melody. Register
stays the genre's business, through `reg` and `bassDrop`.

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
