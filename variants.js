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
 * deliberate extreme. It is kept out of the difference map, which is drawn to
 * show where the real candidates part company.
 *
 * `on` names the character the page opens with. Notes are in Russian on
 * purpose: this page is a workbench, not the product.
 *
 * ---
 *
 * Last round asked whether the background could be heard at all, and the answer
 * was better than a yes: without it the music was cleaner. Measurement agrees
 * and says where — the pad adds about a decibel between 240 and 480 Hz and
 * nothing anywhere else, on every character measured. That band is where sound
 * piles up without being heard as anything: too low to carry a tune, too high
 * to be the bottom. Filling it does not add a part, it adds a veil.
 *
 * But that round had a flaw of mine in it: the version that won removed *two*
 * parts, the pad and the race's instrument, so it does not say which of them
 * was in the way. Both are plausible and the cures are opposite — one is a
 * sustained chord bed, the other eleven notes in fifty seconds.
 *
 * So this round changes one thing at a time. It is the same question asked
 * properly.
 */

const drop = (...parts) => ({
  score(s) { parts.forEach((k) => { s.tracks[k].length = 0; }); },
});

window.VARIANTS = {

  /* the character the finding was heard on */
  on: 'Dame Ilsabet Cross',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Фон и расовый инструмент оба на месте. Версия с главной страницы.' },

    { id: 'noPad',
      label: 'B — без фона',
      note: 'Убран только фон — выдержанные аккорды. Расовый инструмент '
          + 'остался. Если чище стало от этого, виноват фон.',
      ...drop('pad') },

    { id: 'noHue',
      label: 'C — без расового',
      note: 'Убран только расовый инструмент. Фон остался. Если чище стало '
          + 'от этого, виноват не фон, а он.',
      ...drop('hue') },

    { id: 'neither',
      label: 'D — без обоих',
      note: 'То, что ты выбрал в прошлый раз. Здесь — для сверки: если D '
          + 'чище, чем лучший из B и C, значит мешают оба.',
      ...drop('pad', 'hue') },
  ],
};
