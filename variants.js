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
    lead: 'lute', pad: 'harp', perc: 'frame',
    tempo: 116, swing: 0.12, cellMod: +0.15, orn: 0.40, sync: 0.25,
    cadence: 0.70, tension: 0.15, legato: 0.85, attack: 0.90, rev: 0.30,
    rough: 0, drone: false, reg: +2, dyn: 0.66 },

  /* Nordic, and fast. The horn is the barbarian's own and it stays — the round
     that took it away is exactly the round that failed. Short notes, dry room,
     drone underneath, and the tempo Kenny asked for. */
  barbarian: { label: 'скандинавский фолк',
    lead: 'horn', pad: 'dark', perc: 'heavy',
    tempo: 124, swing: 0, cellMod: +0.10, orn: 0.05, sync: 0.15,
    cadence: 0.50, tension: 0.25, legato: 0.95, attack: 0.55, rev: 0.35,
    rough: 0.25, drone: true, reg: -8, dyn: 0.88 },

  /* Classicism: order, symmetry, cadences that close like a door. The most
     disciplined music there is, for the class whose only constant is
     discipline. */
  fighter: { label: 'классицизм',
    lead: 'strings', pad: 'horn', perc: 'martial',
    tempo: 120, swing: 0, cellMod: +0.10, orn: 0.20, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.85, attack: 0.95, rev: 0.30,
    rough: 0, drone: false, reg: 0, dyn: 0.70 },

  /* Baroque, unchanged — the one Kenny has already said is better. No kit at
     all is half the signal. */
  wizard: { label: 'барокко',
    lead: 'lute', pad: 'organ', perc: null,
    tempo: 108, swing: 0, cellMod: +0.35, orn: 0.55, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.75, attack: 0.95, rev: 0.35,
    rough: 0, drone: false, reg: 0, dyn: 0.64 },

  /* Ambient. The source says a druid is "in no way a lord of nature — instead
     they feel themselves part of its irresistible will", which is the sleeve
     note of every ambient record ever pressed. Slow, breathing, no kit. */
  druid: { label: 'ambient',
    lead: 'air', pad: 'strings', perc: null,
    tempo: 78, swing: 0, cellMod: -0.50, orn: 0.05, sync: 0.05,
    cadence: 0.35, tension: 0.15, legato: 2.00, attack: 0.30, rev: 0.75,
    rough: 0, drone: true, reg: -2, dyn: 0.55 },

  /* Chant and organum. The class comment already says the cleric should sound
     like a building rather than a person; this is the music that shape came
     from. */
  cleric: { label: 'григорианский хорал',
    lead: 'choir', pad: 'organ', perc: null,
    tempo: 76, swing: 0, cellMod: -0.45, orn: 0.05, sync: 0.00,
    cadence: 0.85, tension: 0.05, legato: 2.20, attack: 0.35, rev: 0.85,
    rough: 0, drone: true, reg: -2, dyn: 0.60 },

  /* Darkwave. A pact, a patron, an insatiable hunger for power — gothic
     electronics is the sound that genre fiction long ago agreed means exactly
     that. */
  warlock: { label: 'darkwave',
    lead: 'dark', pad: 'pulse', perc: 'tick',
    tempo: 96, swing: 0, cellMod: +0.20, orn: 0.15, sync: 0.35,
    cadence: 0.35, tension: 0.60, legato: 0.90, attack: 0.70, rev: 0.55,
    rough: 0.20, drone: true, reg: -6, dyn: 0.70 },

  /* Chinese pentatonic. The monastery, ki, contemplation — and a scale nobody
     needs to be taught to place. */
  monk: { label: 'китайская пентатоника',
    lead: 'flute', pad: 'harp', perc: 'wood',
    tempo: 88, swing: 0, cellMod: -0.20, orn: 0.35, sync: 0.15,
    cadence: 0.60, tension: 0.05, legato: 1.20, attack: 0.75, rev: 0.45,
    rough: 0, drone: false, reg: +4, dyn: 0.60 },

  /* Romanticism. Heroic, large, noble — the oath as a mighty contract, and the
     one genre where phrases are allowed to climb. */
  paladin: { label: 'романтизм',
    lead: 'brass', pad: 'strings', perc: 'martial',
    tempo: 84, swing: 0, cellMod: 0, orn: 0.25, sync: 0.10,
    cadence: 0.90, tension: 0.35, legato: 1.30, attack: 0.80, rev: 0.50,
    rough: 0, drone: false, rise: +0.30, reg: 0, dyn: 0.80 },

  /* Bossa nova. The source is explicit that a rogue prefers cunning to force —
     one placed strike rather than a flurry. Quiet, syncopated, a light touch,
     and the only primary that is deliberately understated. */
  rogue: { label: 'босса-нова',
    lead: 'pizz', pad: 'harp', perc: 'tick',
    tempo: 128, swing: 0.25, cellMod: +0.20, orn: 0.20, sync: 0.60,
    cadence: 0.45, tension: 0.50, legato: 0.70, attack: 0.85, rev: 0.20,
    rough: 0, drone: false, reg: +2, dyn: 0.55 },

  /* Scandinavian folk. The endless watch on the borderland, alone — a fiddle
     over a drone is what that has always sounded like. */
  ranger: { label: 'скандинавский фолк',
    lead: 'fiddle', pad: 'air', perc: 'frame',
    tempo: 92, swing: 0, cellMod: -0.15, orn: 0.30, sync: 0.15,
    cadence: 0.55, tension: 0.25, legato: 1.10, attack: 0.80, rev: 0.55,
    rough: 0, drone: true, reg: -2, dyn: 0.62 },

  /* Aleatoric music — composition by chance. Wild magic has no better match in
     the whole list, and it is the one place where an unstable, barely governed
     surface is the point rather than a fault. */
  sorcerer: { label: 'алеаторика',
    lead: 'glass', pad: 'pulse', perc: 'tick',
    tempo: 104, swing: 0, cellMod: +0.30, orn: 0.45, sync: 0.70,
    cadence: 0.20, tension: 0.70, legato: 0.80, attack: 0.60, rev: 0.45,
    rough: 0.15, drone: false, leap: +0.50, reg: +2, dyn: 0.72 },

  /* Chiptune. Invention, tools, magic treated as a system to be decoded — and
     collateral damage. Fast, bright, brittle, mechanical. */
  artificer: { label: 'чиптюн',
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

/* The genre decides the instruments, the groove and the room; the character's
   own tags then bend the numbers from there. Judged this way on purpose — the
   version that removes the tags cannot fail, because the genre overwrites the
   very numbers the tags move, and an experiment with one possible answer is not
   an experiment. Kenny listened to this shape and said the genre survives it. */
const TAG_KEYS = ['tempo', 'reg', 'dyn', 'cellMod', 'leap', 'orn', 'sync',
                  'tension', 'cadence', 'rough', 'rev', 'rise'];

function wearing(table) {
  return {
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

window.VARIANTS = {

  on: 'Grukk Skullsplitter',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Версия с главной страницы, без жанра. То, что оба диагностических '
          + 'теста показали на уровне угадывания.' },

    { id: 'primary',
      label: 'B — основной жанр',
      note: 'Бард — трубадуры · Варвар — скандинавский фолк, 124 bpm · '
          + 'Воин — классицизм · Маг — барокко · Друид — ambient · '
          + 'Жрец — хорал · Колдун — darkwave · Монах — китайская пентатоника · '
          + 'Паладин — романтизм · Плут — босса-нова · Следопыт — скандинавский '
          + 'фолк · Чародей — алеаторика · Изобретатель — чиптюн.',
      ...wearing(PRIMARY) },

    { id: 'alternate',
      label: 'C — запасной жанр',
      note: 'Второй кандидат на тот же класс. Бард — цыганский джаз (тот, что '
          + 'тебе уже понравился) · Варвар — индастриал · Воин — минимализм · '
          + 'Маг — сериализм · Друид — кельтское · Жрец — sacred minimalism · '
          + 'Колдун — спектрализм · Монах — минимализм · Паладин — органум · '
          + 'Плут — танго · Следопыт — минимализм дозора · Чародей — trance · '
          + 'Изобретатель — musique concrète.',
      ...wearing(ALTERNATE) },
  ],
};
