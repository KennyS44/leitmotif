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
 * `aid: true` marks a version that is not a candidate — a listening aid, or a
 * deliberate extreme. It is kept out of the difference map.
 *
 * `on` names the character the page opens with. Notes are in Russian on
 * purpose: this page is a workbench, not the product.
 *
 * ---
 *
 * THIS ROUND: does a genre make the class audible?
 *
 * Both diagnostics came back at chance — class only 2/10, race only 2/10. The
 * measurements said why, and it is not that the arrangement is poor. A class
 * signs itself two ways, and neither can be read on one hearing:
 *
 *   - statistically — the family of intervals it is allowed to move by, its
 *     contour, how far it reaches. Nobody extracts a distribution from forty
 *     seconds heard once.
 *   - arbitrarily — this instrument means wizard. An arbitrary code has to be
 *     taught before it can be recognised, and the test teaches nothing.
 *
 * A genre is the one kind of signature that is neither: gross, categorical, and
 * already learned by every listener years before they arrive here. Nobody has
 * to be told what a baroque keyboard piece or a swung violin sounds like.
 *
 * So three classes are dressed in a genre, and the question is only whether the
 * class is audible from the first seconds. Styles are Kenny's to choose — these
 * three are the ones I proposed and they are a first draft, not a decision. Any
 * of them can be swapped for a word.
 *
 *   wizard    → baroque      Nymeria Sylvarion
 *   barbarian → taiko        Grukk Skullsplitter
 *   bard      → gypsy jazz   Fennick Sparrowquill
 *
 * Pick one of those three in the character list. On any other character the
 * genre versions do nothing and B sounds exactly like A — that is expected,
 * only three classes are wired.
 *
 * What a genre is allowed to touch, and why. It takes instrumentation, groove,
 * tempo, articulation and room — the layers a class already owned or nobody
 * did. It does NOT take the race's rhythmic cell or the alignment's mode: those
 * are the only things race and alignment still say, and a genre that ate them
 * would raise this score by making the other fields inaudible, which is how a
 * test flatters itself.
 */

const GENRES = {

  /* Baroque. No kit at all is half the signal — a plucked keyboard over a
     chamber organ, running even notes, trills on the accents, and a cadence
     that lands like a door closing. Straight: not one swung note. */
  wizard: {
    label: 'барокко',
    lead: 'lute', pad: 'organ', perc: null,
    tempo: 108, swing: 0, cellMod: +0.35,
    orn: 0.55, sync: 0.05, cadence: 0.95, tension: 0.10,
    legato: 0.75, attack: 0.95, rev: 0.35, rough: 0, drone: false,
  },

  /* Taiko. The drums are the piece and the melody gets out of their way: slow,
     sparse, sustained, over a drone, in a big room.
     *
     * The lead is a bamboo whistle rather than the barbarian's own horn. Not
     * decoration: the class already plays horn over a heavy kit, so keeping it
     * left B differing from A by tempo alone — a genre nobody could hear. A
     * flute over big drums is the pairing that names this music at a stroke. */
  barbarian: {
    label: 'тайко',
    lead: 'whistle', pad: 'dark', perc: 'heavy',
    tempo: 72, swing: 0, cellMod: -0.35,
    orn: 0.10, sync: 0.05, cadence: 0.50, tension: 0.20,
    legato: 1.50, attack: 0.60, rev: 0.55, rough: 0.05, drone: true,
    reg: -10, dyn: 0.80,
  },

  /* Gypsy jazz. Swing is the whole tell, so it is heavy. A violin over a
     plucked comp, brushes rather than a kit, fast, dry and close, with enough
     tension in the harmony for sixths and ninths. */
  bard: {
    label: 'цыганский джаз',
    lead: 'fiddle', pad: 'lute', perc: 'tick',
    tempo: 168, swing: 0.60, cellMod: +0.40,
    orn: 0.45, sync: 0.55, cadence: 0.60, tension: 0.45,
    legato: 0.70, attack: 0.85, rev: 0.15, rough: 0, drone: false,
    reg: +2, dyn: 0.66,
  },
};

/* The genre is set, not added: it arrives after the class, the race, the
   alignment and the tags have all had their say, and the point of this round is
   to hear the genre rather than the average of the genre and everything else.
   If that turns out to be too blunt it is the next thing to soften — but a
   first look at an idea should not be the version that hedges. */
function dress(p, ch) {
  const g = GENRES[ch.cls];
  if (!g) return null;
  Object.keys(g).forEach((k) => { if (k !== 'label') p[k] = g[k]; });
  return g;
}

const genre = {
  params(p, ch) { dress(p, ch); },
};

/* The same genre on a character stripped of its traits and looks. Not a
   candidate — a deliberate extreme, to hear how much of the theme the dressing
   is actually moving. A single tag swap already rewrites most of the notes, and
   whatever swamps the class signature now will swamp a genre too. If B and C
   sound like different pieces of music, the tags have to be capped before any
   genre can be judged. */
const bare = {
  aid: true,
  params(p, ch) {
    const stripped = window.Mapping.characterToParams({ ...ch, traits: [], looks: [] });
    Object.keys(p).forEach((k) => delete p[k]);
    Object.assign(p, stripped);
    dress(p, ch);
  },
};

window.VARIANTS = {

  on: 'Nymeria Sylvarion',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Версия с главной страницы. Класс подписан семейством интервалов '
          + 'и одним инструментом — обе подписи требуют, чтобы их сначала '
          + 'выучили. Оба диагностических теста дали 2/10 при шансе 2.5.' },

    { id: 'genre',
      label: 'B — жанр',
      note: 'Класс одет в жанр: инструменты, грув, темп, артикуляция, '
          + 'помещение. Ячейка расы и лад мировоззрения не тронуты — иначе '
          + 'тест польстил бы себе, сделав остальные поля неслышными. '
          + 'Вопрос один: слышно ли с первых секунд, что это за класс. '
          + 'Работает на Nymeria (маг), Grukk (варвар), Fennick (бард).',
      ...genre },

    { id: 'bare',
      label: 'C — жанр без тегов',
      note: 'Тот же жанр, но у персонажа убраны traits и looks. Не кандидат, '
          + 'а замер: если B и C звучат как разные пьесы, значит «одежда» '
          + 'забивает жанр так же, как забивала класс, и её придётся '
          + 'ограничить до того, как жанры вообще можно будет судить.',
      ...bare },
  ],
};
