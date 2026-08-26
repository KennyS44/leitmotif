'use strict';

/* The versions the A/B page puts side by side.
 *
 * This is the one file that is rewritten every round. When an edit has a degree
 * to it — "a little louder" — guessing the amount costs a whole round: I pick a
 * number, you listen, you say "not that much". Instead I put the amounts here
 * and you answer with a letter.
 *
 * A variant is a patch, not a copy of the code. `params` bends the parameters
 * before the score is written; `score` bends the score before it is played.
 * Everything else stays identical on both sides, so what is heard is the change
 * and nothing else. The first entry is always the version now on the front
 * page: without something to beat, "better" has no meaning.
 *
 * `on` names the character the page opens with. Notes are in Russian on
 * purpose: this page is a workbench, not the product.
 *
 * ---
 *
 * THIS ROUND: a genre for every class, two candidates each.
 *
 * Settled by the last three rounds, and none of it recoverable from the code:
 *
 *   - Both diagnostics came back at chance. A class signs itself either
 *     statistically (its family of intervals) or arbitrarily (this instrument
 *     means wizard), and neither can be read on one hearing by someone who was
 *     never taught the code. A genre is the one signature that needs no
 *     teaching, because every listener already has it.
 *   - Wizard-as-baroque and bard-as-gypsy-jazz both beat the current sound.
 *   - **The genre survives the dressing.** Judged with the tags laid back over
 *     the genre rather than removed, which is the version that can fail. This
 *     is the finding that makes the plan safe to scale: the tags swamped an
 *     arbitrary signature and cannot swamp a learned one.
 *   - The barbarian's first failure was mine, not the idea's. I changed the
 *     genre and the lead instrument in the same version; restoring the class's
 *     own horn fixed what Kenny heard as "a cross between a druid and a bard".
 *     Recorded already, over the pad: one change at a time.
 *   - And then: the barbarian wants more energy and a faster tempo. 72 bpm was
 *     a funeral. It is 124 here.
 *
 * Two rules decided the picks, and both are about telling classes APART rather
 * than about any one class being right:
 *
 *   - **The palette is the budget.** Sixteen voices, six kits, and only two
 *     synthetic timbres — `pulse` and `dark`. Handing techno, trance and house
 *     to three different classes would give all three the same sound whatever
 *     the labels said. Among the primaries only the warlock and the artificer
 *     are synth-led, and they sit at 96 and 140 bpm, six semitones apart.
 *   - **A genre that lives in the drum pattern cannot speak here.** The cell
 *     belongs to the race and the genre layer does not take it, which is why
 *     taiko never quite arrived. Everything below lives in instrumentation,
 *     harmony and articulation instead — the layers a genre actually owns.
 *
 * Descriptions came from dnd.su, class by class, so the match is to what the
 * source says a class IS rather than to what I assume it is.
 */

/* label is documentation only; every other key is written straight onto the
   parameters. */
const PRIMARY = {

  /* Troubadour song. The lute is the bard's own instrument and the frame drum
     is the one percussion that reads as "a person playing", not as a kit. */
  bard: { label: 'трубадуры / ars nova',
    comp: 'pompe', bassFig: 'alternating', bassVoice: 'pizz',
    lead: 'lute', pad: 'harp', perc: 'frame',
    tempo: 116, swing: 0.12, cellMod: +0.15, orn: 0.40, sync: 0.25,
    cadence: 0.70, tension: 0.15, legato: 0.85, attack: 0.90, rev: 0.30,
    rough: 0, drone: false, reg: +2, dyn: 0.66 },

  /* Nordic, and fast. The horn is the barbarian's own and it stays — the round
     that took it away is exactly the round that failed. Short notes, dry room,
     drone underneath, and the tempo Kenny asked for. */
  barbarian: { label: 'скандинавский фолк',
    comp: 'pulse', bassFig: 'pedal', bassVoice: 'dark',
    lead: 'horn', pad: 'dark', perc: 'heavy',
    tempo: 124, swing: 0, cellMod: +0.10, orn: 0.05, sync: 0.15,
    cadence: 0.50, tension: 0.25, legato: 0.95, attack: 0.55, rev: 0.35,
    rough: 0.25, drone: true, reg: -8, dyn: 0.88 },

  /* Classicism: order, symmetry, cadences that close like a door. The most
     disciplined music there is, for the class whose only constant is
     discipline. */
  fighter: { label: 'классицизм',
    comp: 'pulse', bassFig: 'alternating', bassVoice: 'pizz',
    lead: 'strings', pad: 'horn', perc: 'martial',
    tempo: 120, swing: 0, cellMod: +0.10, orn: 0.20, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.85, attack: 0.95, rev: 0.30,
    rough: 0, drone: false, reg: 0, dyn: 0.70 },

  /* Baroque, unchanged — the one Kenny has already said is better. No kit at
     all is half the signal. */
  wizard: { label: 'барокко',
    comp: 'arpeggio', bassFig: 'walking', bassVoice: 'organ',
    lead: 'lute', pad: 'organ', perc: null,
    tempo: 108, swing: 0, cellMod: +0.35, orn: 0.55, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.75, attack: 0.95, rev: 0.35,
    rough: 0, drone: false, reg: 0, dyn: 0.64 },

  /* Ambient. The source says a druid is "in no way a lord of nature — instead
     they feel themselves part of its irresistible will", which is the sleeve
     note of every ambient record ever pressed. Slow, breathing, no kit. */
  /* and the one you asked for: wind underneath, birds on the colour track.
     They are pitched from the harmony, so the forest is in the key. */
  druid: { label: 'ambient + природа',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'dark',
    lead: 'air', pad: 'wind', hue: 'birds', perc: null,
    tempo: 78, swing: 0, cellMod: -0.50, orn: 0.05, sync: 0.05,
    cadence: 0.35, tension: 0.15, legato: 2.00, attack: 0.30, rev: 0.75,
    rough: 0, drone: true, reg: -2, dyn: 0.55 },

  /* Chant and organum. The class comment already says the cleric should sound
     like a building rather than a person; this is the music that shape came
     from. */
  cleric: { label: 'григорианский хорал',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'organ',
    lead: 'choir', pad: 'organ', perc: null,
    tempo: 76, swing: 0, cellMod: -0.45, orn: 0.05, sync: 0.00,
    cadence: 0.85, tension: 0.05, legato: 2.20, attack: 0.35, rev: 0.85,
    rough: 0, drone: true, reg: -2, dyn: 0.60 },

  /* Darkwave. A pact, a patron, an insatiable hunger for power — gothic
     electronics is the sound that genre fiction long ago agreed means exactly
     that. */
  warlock: { label: 'darkwave',
    comp: 'offbeat', bassFig: 'sparse', bassVoice: 'dark',
    lead: 'dark', pad: 'pulse', perc: 'tick',
    tempo: 96, swing: 0, cellMod: +0.20, orn: 0.15, sync: 0.35,
    cadence: 0.35, tension: 0.60, legato: 0.90, attack: 0.70, rev: 0.55,
    rough: 0.20, drone: true, reg: -6, dyn: 0.70 },

  /* Chinese pentatonic. The monastery, ki, contemplation — and a scale nobody
     needs to be taught to place. */
  monk: { label: 'китайская пентатоника',
    comp: 'none', bassFig: 'sparse', bassVoice: 'harp',
    lead: 'flute', pad: 'harp', perc: 'wood',
    tempo: 88, swing: 0, cellMod: -0.20, orn: 0.35, sync: 0.15,
    cadence: 0.60, tension: 0.05, legato: 1.20, attack: 0.75, rev: 0.45,
    rough: 0, drone: false, reg: +4, dyn: 0.60 },

  /* Romanticism. Heroic, large, noble — the oath as a mighty contract, and the
     one genre where phrases are allowed to climb. */
  paladin: { label: 'романтизм',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'organ',
    lead: 'brass', pad: 'strings', perc: 'martial',
    tempo: 84, swing: 0, cellMod: 0, orn: 0.25, sync: 0.10,
    cadence: 0.90, tension: 0.35, legato: 1.30, attack: 0.80, rev: 0.50,
    rough: 0, drone: false, rise: +0.30, reg: 0, dyn: 0.80 },

  /* Bossa nova. The source is explicit that a rogue prefers cunning to force —
     one placed strike rather than a flurry. Quiet, syncopated, a light touch,
     and the only primary that is deliberately understated. */
  rogue: { label: 'босса-нова',
    comp: 'offbeat', bassFig: 'walking', bassVoice: 'pizz',
    lead: 'pizz', pad: 'harp', perc: 'tick',
    tempo: 128, swing: 0.25, cellMod: +0.20, orn: 0.20, sync: 0.60,
    cadence: 0.45, tension: 0.50, legato: 0.70, attack: 0.85, rev: 0.20,
    rough: 0, drone: false, reg: +2, dyn: 0.55 },

  /* Scandinavian folk. The endless watch on the borderland, alone — a fiddle
     over a drone is what that has always sounded like. */
  ranger: { label: 'скандинавский фолк',
    comp: 'arpeggio', bassFig: 'sparse', bassVoice: 'harp',
    lead: 'fiddle', pad: 'air', perc: 'frame',
    tempo: 92, swing: 0, cellMod: -0.15, orn: 0.30, sync: 0.15,
    cadence: 0.55, tension: 0.25, legato: 1.10, attack: 0.80, rev: 0.55,
    rough: 0, drone: true, reg: -2, dyn: 0.62 },

  /* Aleatoric music — composition by chance. Wild magic has no better match in
     the whole list, and it is the one place where an unstable, barely governed
     surface is the point rather than a fault. */
  sorcerer: { label: 'алеаторика',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pulse',
    lead: 'glass', pad: 'pulse', perc: 'tick',
    tempo: 104, swing: 0, cellMod: +0.30, orn: 0.45, sync: 0.70,
    cadence: 0.20, tension: 0.70, legato: 0.80, attack: 0.60, rev: 0.45,
    rough: 0.15, drone: false, leap: +0.50, reg: +2, dyn: 0.72 },

  /* Chiptune. Invention, tools, magic treated as a system to be decoded — and
     collateral damage. Fast, bright, brittle, mechanical. */
  artificer: { label: 'чиптюн',
    comp: 'pulse', bassFig: 'alternating', bassVoice: 'pulse',
    lead: 'pulse', pad: 'glass', perc: 'tick',
    tempo: 140, swing: 0, cellMod: +0.45, orn: 0.25, sync: 0.40,
    cadence: 0.60, tension: 0.25, legato: 0.50, attack: 1.00, rev: 0.15,
    rough: 0, drone: false, reg: +5, dyn: 0.68 },
};

/* The runner-up for each class. Kept playable rather than described, because a
   second candidate argued about on paper costs a whole round and a second
   candidate on the timeline costs a letter. */
const ALTERNATE = {

  /* the version Kenny already preferred to the current sound */
  bard: { label: 'цыганский джаз',
    lead: 'fiddle', pad: 'lute', perc: 'tick',
    tempo: 168, swing: 0.60, cellMod: +0.40, orn: 0.45, sync: 0.55,
    cadence: 0.60, tension: 0.45, legato: 0.70, attack: 0.85, rev: 0.15,
    rough: 0, drone: false, reg: +2, dyn: 0.66 },

  barbarian: { label: 'индастриал',
    lead: 'pulse', pad: 'dark', perc: 'heavy',
    tempo: 132, swing: 0, cellMod: +0.25, orn: 0.00, sync: 0.20,
    cadence: 0.40, tension: 0.45, legato: 0.80, attack: 0.50, rev: 0.20,
    rough: 0.60, drone: true, reg: -6, dyn: 0.90 },

  fighter: { label: 'минимализм',
    lead: 'pizz', pad: 'strings', perc: 'tick',
    tempo: 132, swing: 0, cellMod: +0.50, orn: 0.00, sync: 0.10,
    cadence: 0.40, tension: 0.15, legato: 0.60, attack: 0.95, rev: 0.25,
    rough: 0, drone: false, reg: 0, dyn: 0.66 },

  wizard: { label: 'сериализм',
    lead: 'glass', pad: 'dark', perc: 'tick',
    tempo: 96, swing: 0, cellMod: +0.10, orn: 0.10, sync: 0.50,
    cadence: 0.15, tension: 0.85, legato: 0.70, attack: 0.85, rev: 0.40,
    rough: 0, drone: false, leap: +0.50, reg: +2, dyn: 0.62 },

  druid: { label: 'кельтское',
    lead: 'whistle', pad: 'harp', perc: 'frame',
    tempo: 108, swing: 0.20, cellMod: +0.10, orn: 0.50, sync: 0.25,
    cadence: 0.65, tension: 0.10, legato: 0.95, attack: 0.85, rev: 0.35,
    rough: 0, drone: true, reg: +2, dyn: 0.64 },

  cleric: { label: 'sacred minimalism',
    lead: 'bell', pad: 'choir', perc: null,
    tempo: 72, swing: 0, cellMod: -0.30, orn: 0.00, sync: 0.05,
    cadence: 0.70, tension: 0.10, legato: 1.80, attack: 0.45, rev: 0.80,
    rough: 0, drone: false, reg: +2, dyn: 0.58 },

  warlock: { label: 'спектрализм',
    lead: 'glass', pad: 'air', perc: null,
    tempo: 84, swing: 0, cellMod: -0.40, orn: 0.05, sync: 0.10,
    cadence: 0.20, tension: 0.75, legato: 2.20, attack: 0.40, rev: 0.80,
    rough: 0.10, drone: true, reg: -4, dyn: 0.58 },

  monk: { label: 'минимализм',
    lead: 'bell', pad: 'air', perc: 'tick',
    tempo: 100, swing: 0, cellMod: +0.40, orn: 0.00, sync: 0.10,
    cadence: 0.30, tension: 0.05, legato: 0.70, attack: 0.90, rev: 0.50,
    rough: 0, drone: false, reg: +4, dyn: 0.58 },

  paladin: { label: 'органум',
    lead: 'choir', pad: 'organ', perc: 'frame',
    tempo: 82, swing: 0, cellMod: -0.40, orn: 0.05, sync: 0.00,
    cadence: 0.85, tension: 0.10, legato: 2.00, attack: 0.40, rev: 0.80,
    rough: 0, drone: true, reg: -2, dyn: 0.68 },

  rogue: { label: 'танго',
    lead: 'fiddle', pad: 'lute', perc: 'wood',
    tempo: 112, swing: 0, cellMod: +0.15, orn: 0.30, sync: 0.40,
    cadence: 0.70, tension: 0.45, legato: 0.80, attack: 0.70, rev: 0.25,
    rough: 0, drone: false, reg: 0, dyn: 0.70 },

  ranger: { label: 'минимализм дозора',
    lead: 'whistle', pad: 'strings', perc: 'tick',
    tempo: 76, swing: 0, cellMod: -0.35, orn: 0.10, sync: 0.10,
    cadence: 0.45, tension: 0.20, legato: 1.50, attack: 0.55, rev: 0.60,
    rough: 0, drone: true, reg: -2, dyn: 0.58 },

  sorcerer: { label: 'trance / goa',
    lead: 'pulse', pad: 'dark', perc: 'light',
    tempo: 138, swing: 0, cellMod: +0.50, orn: 0.10, sync: 0.30,
    cadence: 0.40, tension: 0.30, legato: 0.60, attack: 0.90, rev: 0.50,
    rough: 0, drone: true, rise: +0.40, reg: 0, dyn: 0.74 },

  artificer: { label: 'musique concrète',
    lead: 'glass', pad: 'dark', perc: 'wood',
    tempo: 92, swing: 0, cellMod: +0.20, orn: 0.10, sync: 0.60,
    cadence: 0.15, tension: 0.60, legato: 0.65, attack: 0.80, rev: 0.50,
    rough: 0.40, drone: false, reg: 0, dyn: 0.66 },
};

/* THE SECOND SEARCH.
 *
 * Four classes missed on both candidates — wizard, barbarian, bard, druid — so
 * they get two fresh ones each. Two more classes get what Kenny named himself:
 * the monk should hear the ranger's watch-minimalism, and the artificer should
 * hear Nordic folk and industrial.
 *
 * Everything else is left out of D and E on purpose. A class that already has
 * an answer sounds like A here, and the note says so — filling the gap with a
 * repeat of its own genre would make four versions where there are two.
 *
 * These are picked against the figures, which did not exist when the first
 * eight were chosen. Ragtime is stride bass and a syncopated right hand; it was
 * not expressible a day ago. Neither was a Balkan brass band, which is an
 * off-beat chug or it is nothing.
 */
const FRESH_A = {

  /* "Плетения магии" is literally weaving, and polyphony is the music of
     independent lines woven together. A plucked accompaniment and a bass that
     walks keep it moving, which is what separates it from the cleric's chant. */
  wizard: { label: 'ренессансная полифония',
    comp: 'arpeggio', bassFig: 'walking', bassVoice: 'organ',
    lead: 'choir', pad: 'harp', perc: null,
    tempo: 100, swing: 0, cellMod: +0.10, orn: 0.15, sync: 0.10,
    cadence: 0.80, tension: 0.15, legato: 1.40, attack: 0.70, rev: 0.65,
    rough: 0, drone: false, reg: 0, dyn: 0.62 },

  /* A Balkan brass band: fast, hot, loud and slightly out of control. Keeps the
     barbarian's brass, which is the part that carries the fury — the round that
     took the horn away is the round that failed. */
  barbarian: { label: 'балканская духовая',
    comp: 'offbeat', bassFig: 'alternating', bassVoice: 'horn',
    lead: 'brass', pad: 'horn', perc: 'heavy',
    tempo: 152, swing: 0, cellMod: +0.30, orn: 0.35, sync: 0.40,
    cadence: 0.55, tension: 0.30, legato: 0.60, attack: 0.50, rev: 0.25,
    rough: 0.30, drone: false, reg: -4, dyn: 0.90 },

  /* Ragtime: the entertainer. The left hand strides between root and fifth
     while the right hand syncopates against it — which is exactly the pair of
     figures added this round, and the reason to try it now. */
  bard: { label: 'рэгтайм',
    comp: 'offbeat', bassFig: 'alternating', bassVoice: 'pizz',
    lead: 'lute', pad: 'pizz', perc: 'tick',
    tempo: 96, swing: 0.10, cellMod: +0.30, orn: 0.30, sync: 0.65,
    cadence: 0.80, tension: 0.30, legato: 0.60, attack: 0.95, rev: 0.20,
    rough: 0, drone: false, reg: +2, dyn: 0.70 },

  /* A raga. Ambient caught only the calm half of a druid; the source also says
     "гнев природы" and "неодолимая воля". A drone that unfolds slowly and then
     will not stop is that second half, and it is unlike anything else here. */
  druid: { label: 'индийская рага',
    comp: 'none', bassFig: 'pedal', bassVoice: 'dark',
    lead: 'whistle', pad: 'wind', hue: 'birds', perc: 'frame',
    tempo: 68, swing: 0, cellMod: -0.30, orn: 0.60, sync: 0.10,
    cadence: 0.30, tension: 0.20, legato: 1.60, attack: 0.60, rev: 0.60,
    rough: 0, drone: true, rise: +0.30, reg: -2, dyn: 0.60 },

  /* what Kenny said suits the monk better than either of his own two */
  monk: { label: 'минимализм дозора',
    comp: 'arpeggio', bassFig: 'sparse', bassVoice: 'harp',
    lead: 'whistle', pad: 'strings', perc: 'tick',
    tempo: 96, swing: 0, cellMod: -0.35, orn: 0.10, sync: 0.10,
    cadence: 0.45, tension: 0.20, legato: 1.50, attack: 0.55, rev: 0.60,
    rough: 0, drone: true, reg: -2, dyn: 0.58 },

  /* the first of the two he asked to hear on the artificer */
  artificer: { label: 'скандинавский фолк',
    comp: 'pulse', bassFig: 'pedal', bassVoice: 'dark',
    lead: 'fiddle', pad: 'air', perc: 'frame',
    tempo: 92, swing: 0, cellMod: -0.10, orn: 0.30, sync: 0.15,
    cadence: 0.55, tension: 0.25, legato: 1.10, attack: 0.80, rev: 0.55,
    rough: 0, drone: true, reg: -2, dyn: 0.64 },
};

const FRESH_B = {

  /* Impressionism: shimmer, whole-tone haze, nothing landing quite where it was
     promised. The illusion school by another name. */
  wizard: { label: 'импрессионизм',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'glass', pad: 'harp', hue: 'air', perc: null,
    tempo: 84, swing: 0, cellMod: +0.20, orn: 0.35, sync: 0.25,
    cadence: 0.25, tension: 0.45, legato: 1.50, attack: 0.50, rev: 0.65,
    rough: 0, drone: false, reg: +3, dyn: 0.58 },

  /* Motorik. Not a rhythm the drums have to carry — a pulse that simply never
     stops, which is what "необузданный, неугасимый" sounds like from outside. */
  barbarian: { label: 'krautrock / motorik',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pulse',
    lead: 'horn', pad: 'pulse', perc: 'heavy',
    tempo: 144, swing: 0, cellMod: +0.35, orn: 0.05, sync: 0.15,
    cadence: 0.35, tension: 0.30, legato: 0.55, attack: 0.60, rev: 0.30,
    rough: 0.20, drone: true, reg: -6, dyn: 0.85 },

  /* A shanty. The source has a bard inspiring allies and carrying the tale —
     which is a room singing together, not a soloist being clever. Deliberately
     the opposite of gypsy jazz, since that missed. */
  bard: { label: 'морские шанти',
    comp: 'pulse', bassFig: 'alternating', bassVoice: 'pizz',
    lead: 'choir', pad: 'lute', perc: 'frame',
    tempo: 104, swing: 0, cellMod: +0.05, orn: 0.15, sync: 0.15,
    cadence: 0.85, tension: 0.10, legato: 1.10, attack: 0.80, rev: 0.40,
    rough: 0, drone: false, reg: -2, dyn: 0.75 },

  /* Nature as process rather than as weather: interlocking parts that shift
     against each other. The background here is the rustle itself. */
  druid: { label: 'минимализм / процессы',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'flute', pad: 'leaves', hue: 'birds', perc: 'tick',
    tempo: 104, swing: 0, cellMod: +0.45, orn: 0.00, sync: 0.10,
    cadence: 0.30, tension: 0.10, legato: 0.70, attack: 0.85, rev: 0.50,
    rough: 0, drone: false, reg: 0, dyn: 0.60 },

  /* Gagaku: Japanese court music. Ceremonial, unhurried, a held reed underneath
     — a monastery from a different direction than the pentatonic one. */
  monk: { label: 'гагаку',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'organ',
    lead: 'whistle', pad: 'organ', perc: 'wood',
    tempo: 92, swing: 0, cellMod: -0.30, orn: 0.40, sync: 0.05,
    cadence: 0.50, tension: 0.25, legato: 1.80, attack: 0.55, rev: 0.70,
    rough: 0, drone: true, reg: +2, dyn: 0.58 },

  /* the second of the two he asked to hear on the artificer */
  artificer: { label: 'индастриал',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pulse',
    lead: 'pulse', pad: 'dark', perc: 'heavy',
    tempo: 132, swing: 0, cellMod: +0.25, orn: 0.00, sync: 0.20,
    cadence: 0.40, tension: 0.45, legato: 0.50, attack: 0.50, rev: 0.20,
    rough: 0.60, drone: true, reg: -4, dyn: 0.88 },
};

/* The genre decides the instruments, the groove and the room; the character's
   own tags then bend the numbers from there. Judged this way on purpose — the
   version that removes the tags cannot fail, because the genre overwrites the
   very numbers the tags move, and an experiment with one possible answer is not
   an experiment. Kenny listened to this shape and said the genre survives it. */
const TAG_KEYS = ['tempo', 'reg', 'dyn', 'cellMod', 'leap', 'orn', 'sync',
                  'tension', 'cadence', 'rough', 'rev', 'rise'];

function wearing(table) {
  return {
    /* which genre this version puts on that character, for pages that label
       rather than play — the plan diagrams need the name, not the numbers */
    genreOf(ch) { return table[ch.cls] ? table[ch.cls].label : null; },
    params(p, ch) {
      const g = table[ch.cls];
      if (!g) return;
      const withTags = window.Mapping.characterToParams(ch);
      const without = window.Mapping.characterToParams({ ...ch, traits: [], looks: [] });
      Object.keys(g).forEach((k) => { if (k !== 'label') p[k] = g[k]; });
      TAG_KEYS.forEach((k) => { p[k] += withTags[k] - without[k]; });
    },
  };
}

/* The class list under a version is built from the table it describes, not
   typed out beside it.
 *
 * It was typed out, once, and it drifted within a day: the sheet said
 * "Волшебник" because that is what the dictionary says, and my hand-written
 * line under it said "Маг". Kenny caught it and asked whether the wizard had
 * quietly become a different class. Two names for one class, on one screen, at
 * the exact moment he is being asked which class he is hearing.
 *
 * A list that is maintained by hand next to the thing it lists will disagree
 * with it eventually. Read once, from `Sheet`, sorted by the Russian name so a
 * class can be found by eye. Read lazily, because the bench switches to Russian
 * after this file has already loaded. */
function listing(table) {
  return Object.keys(table)
    .map((cls) => ({
      name: window.Sheet.label('classes', cls, window.Mapping.CLASSES[cls].label),
      genre: table[cls].label,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    .map((x) => `${x.name} — ${x.genre}`)
    .join(' · ');
}

window.VARIANTS = {

  on: 'Grukk Skullsplitter',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Версия с главной страницы, без жанра. То, что оба диагностических '
          + 'теста показали на уровне угадывания.' },

    { id: 'primary',
      label: 'B — основной жанр',
      get note() { return listing(PRIMARY); },
      ...wearing(PRIMARY) },

    { id: 'alternate',
      label: 'C — запасной жанр',
      get note() { return `Второй кандидат на тот же класс. ${listing(ALTERNATE)}`; },
      ...wearing(ALTERNATE) },

    { id: 'freshA',
      label: 'D — новый поиск 1',
      get note() {
        return `Только для тех, кто промахнулся. ${listing(FRESH_A)}. `
          + 'На остальных классах звучит как A — у них ответ уже есть, и '
          + 'повтор их же жанра сделал бы четыре версии там, где их две.';
      },
      ...wearing(FRESH_A) },

    { id: 'freshB',
      label: 'E — новый поиск 2',
      get note() {
        return `Второй новый кандидат. ${listing(FRESH_B)}. `
          + 'На остальных классах — как A.';
      },
      ...wearing(FRESH_B) },
  ],
};
