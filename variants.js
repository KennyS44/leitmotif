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
 * THIS ROUND: the search is over for eleven classes, so it stops being offered.
 *
 * Five versions to click through was making the testing longer than the
 * listening, and most of what was on offer had already been rejected. Every
 * genre Kenny has ruled out is gone from here. Where it survives is
 * DECISIONS.md, which exists precisely to stop a rejected idea coming back next
 * week wearing a new hat — and nobody has to click through that.
 *
 * *My mistake, and what it cost.* Last round I recorded his verdicts and did
 * not apply them, reasoning that a genre judged before the accompaniment
 * figures existed should be re-judged after. The reasoning was not wrong; not
 * acting on it was. He went to listen expecting his own choices to be in place,
 * found the ranger still on Nordic folk instead of the baroque he had asked
 * for, and had to spend the round working out whether I had ignored him.
 * A decision recorded and not applied reads as a decision lost.
 *
 * What is settled, from his own words:
 *
 *   бард       — открыт, оба новых «более резкие, а надо плавнее»
 *   варвар     — балканская духовая, «по темпу и ритмике», не хватает низа
 *   воин       — классицизм; просит развития по частям
 *   волшебник  — импрессионизм
 *   друид      — минимализм / процессы; природу доработать
 *   жрец       — григорианский хорал
 *   изобретатель — индастриал
 *   колдун     — darkwave
 *   монах      — минимализм дозора
 *   паладин    — органум
 *   плут       — танго; бас всё ещё однотипный
 *   следопыт   — барокко
 *   чародей    — trance / goa
 */

const CHOSEN = {

  /* OPEN. Both of the last pair came back "более резкие, а надо плавнее", so
     what stands here is a placeholder to have something under the class, not an
     answer. The two candidates in C are the actual question. */
  bard: { label: 'мадригал (открыт)',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'choir', pad: 'harp', perc: null,
    tempo: 96, swing: 0, cellMod: -0.10, orn: 0.20, sync: 0.10,
    cadence: 0.75, tension: 0.15, legato: 1.60, attack: 0.55, rev: 0.55,
    rough: 0, drone: false, reg: 0, dyn: 0.60 },

  /* Tempo and rhythm were right; the fury was not down there. The brass keeps
     the top, and the bottom arrives — ten semitones lower, a low synth carrying
     the pad instead of a second horn, and a drone under all of it. */
  barbarian: { label: 'балканская духовая',
    comp: 'offbeat', bassFig: 'alternating', bassVoice: 'horn',
    lead: 'brass', pad: 'dark', perc: 'heavy',
    tempo: 152, swing: 0, cellMod: +0.30, orn: 0.35, sync: 0.40,
    cadence: 0.55, tension: 0.30, legato: 0.60, attack: 0.50, rev: 0.25,
    rough: 0.30, drone: true, reg: -12, bassDrop: -10, dyn: 0.94 },

  fighter: { label: 'классицизм',
    comp: 'pulse', bassFig: 'alternating', bassVoice: 'pizz',
    lead: 'strings', pad: 'horn', perc: 'martial',
    tempo: 120, swing: 0, cellMod: +0.10, orn: 0.20, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.85, attack: 0.95, rev: 0.30,
    rough: 0, drone: false, reg: 0, dyn: 0.70 },

  wizard: { label: 'импрессионизм',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'glass', pad: 'harp', hue: 'air', perc: null,
    tempo: 84, swing: 0, cellMod: +0.20, orn: 0.35, sync: 0.25,
    cadence: 0.25, tension: 0.45, legato: 1.50, attack: 0.50, rev: 0.65,
    rough: 0, drone: false, reg: +3, dyn: 0.58 },

  druid: { label: 'минимализм / процессы',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'flute', pad: 'leaves', hue: 'birds', perc: 'tick',
    tempo: 104, swing: 0, cellMod: +0.45, orn: 0.00, sync: 0.10,
    cadence: 0.30, tension: 0.10, legato: 0.70, attack: 0.85, rev: 0.50,
    rough: 0, drone: false, reg: 0, dyn: 0.60 },

  cleric: { label: 'григорианский хорал',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'organ',
    lead: 'choir', pad: 'organ', perc: null,
    tempo: 76, swing: 0, cellMod: -0.45, orn: 0.05, sync: 0.00,
    cadence: 0.85, tension: 0.05, legato: 2.20, attack: 0.35, rev: 0.85,
    rough: 0, drone: true, reg: -2, dyn: 0.60 },

  warlock: { label: 'darkwave',
    comp: 'offbeat', bassFig: 'sparse', bassVoice: 'dark',
    lead: 'dark', pad: 'pulse', perc: 'tick',
    tempo: 96, swing: 0, cellMod: +0.20, orn: 0.15, sync: 0.35,
    cadence: 0.35, tension: 0.60, legato: 0.90, attack: 0.70, rev: 0.55,
    rough: 0.20, drone: true, reg: -6, dyn: 0.70 },

  monk: { label: 'минимализм дозора',
    comp: 'arpeggio', bassFig: 'sparse', bassVoice: 'harp',
    lead: 'whistle', pad: 'strings', perc: 'tick',
    tempo: 96, swing: 0, cellMod: -0.35, orn: 0.10, sync: 0.10,
    cadence: 0.45, tension: 0.20, legato: 1.50, attack: 0.55, rev: 0.60,
    rough: 0, drone: true, reg: -2, dyn: 0.58 },

  paladin: { label: 'органум',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'organ',
    lead: 'choir', pad: 'organ', perc: 'frame',
    tempo: 82, swing: 0, cellMod: -0.40, orn: 0.05, sync: 0.00,
    cadence: 0.85, tension: 0.10, legato: 2.00, attack: 0.40, rev: 0.80,
    rough: 0, drone: true, reg: -2, dyn: 0.68 },

  rogue: { label: 'танго',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pizz',
    lead: 'fiddle', pad: 'lute', perc: 'wood',
    tempo: 112, swing: 0, cellMod: +0.15, orn: 0.30, sync: 0.40,
    cadence: 0.70, tension: 0.45, legato: 0.80, attack: 0.70, rev: 0.25,
    rough: 0, drone: false, reg: 0, dyn: 0.70 },

  /* asked for by name, and never actually put in place until now */
  ranger: { label: 'барокко',
    comp: 'arpeggio', bassFig: 'walking', bassVoice: 'organ',
    lead: 'lute', pad: 'organ', perc: null,
    tempo: 108, swing: 0, cellMod: +0.35, orn: 0.55, sync: 0.05,
    cadence: 0.95, tension: 0.10, legato: 0.75, attack: 0.95, rev: 0.35,
    rough: 0, drone: false, reg: 0, dyn: 0.64 },

  sorcerer: { label: 'trance / goa',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pulse',
    lead: 'pulse', pad: 'dark', perc: 'light',
    tempo: 138, swing: 0, cellMod: +0.50, orn: 0.10, sync: 0.30,
    cadence: 0.40, tension: 0.30, legato: 0.60, attack: 0.90, rev: 0.50,
    rough: 0, drone: true, rise: +0.40, reg: 0, dyn: 0.74 },

  artificer: { label: 'индастриал',
    comp: 'pulse', bassFig: 'walking', bassVoice: 'pulse',
    lead: 'pulse', pad: 'dark', perc: 'heavy',
    tempo: 132, swing: 0, cellMod: +0.25, orn: 0.00, sync: 0.20,
    cadence: 0.40, tension: 0.45, legato: 0.50, attack: 0.50, rev: 0.20,
    rough: 0.60, drone: true, reg: -4, dyn: 0.88 },
};

/* The one class still being searched for. Both of the last pair were "более
   резкие" — so both of these are the opposite by construction: no kit or a
   soft one, long notes, soft attacks, flowing accompaniment, nothing struck
   hard. If neither is right, the direction is at least now the right one. */
const SOFT_BARD = {
  bard: { label: 'салонный романс',
    comp: 'arpeggio', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'strings', pad: 'harp', perc: null,
    tempo: 86, swing: 0, cellMod: 0.00, orn: 0.25, sync: 0.05,
    cadence: 0.80, tension: 0.25, legato: 1.80, attack: 0.45, rev: 0.60,
    rough: 0, drone: false, reg: 0, dyn: 0.58 },
};

const SOFT_BARD_2 = {
  bard: { label: 'колыбельная / баркарола',
    comp: 'swell', bassFig: 'pedal', bassVoice: 'harp',
    lead: 'flute', pad: 'air', perc: null,
    tempo: 74, swing: 0.15, cellMod: -0.25, orn: 0.15, sync: 0.05,
    cadence: 0.70, tension: 0.10, legato: 2.00, attack: 0.35, rev: 0.70,
    rough: 0, drone: false, reg: +2, dyn: 0.52 },
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
   typed out beside it. It was typed out, once, and it drifted within a day:
   the sheet said "Волшебник" because that is what the dictionary says, and my
   hand-written line under it said "Маг". Read once, from `Sheet`, sorted by the
   Russian name — and lazily, because the bench switches to Russian after this
   file has already loaded. */
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

  on: 'Fennick Sparrowquill',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Версия с главной страницы, без жанра. Остаётся только затем, '
          + 'чтобы новым версиям было что превзойти.' },

    { id: 'chosen',
      label: 'B — выбранный жанр',
      get note() { return listing(CHOSEN); },
      ...wearing(CHOSEN) },

    { id: 'softBard',
      label: 'C — бард помягче 1',
      get note() {
        return `${listing(SOFT_BARD)}. Только для барда — у остальных классов `
          + 'жанр выбран, и повторять его здесь значило бы возвращать клики, '
          + 'которые этот раунд убирает. На них звучит как A.';
      },
      ...wearing(SOFT_BARD) },

    { id: 'softBard2',
      label: 'D — бард помягче 2',
      get note() {
        return `${listing(SOFT_BARD_2)}. Тоже только для барда. На остальных — как A.`;
      },
      ...wearing(SOFT_BARD_2) },
  ],
};
