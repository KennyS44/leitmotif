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
 * Settled by ear, twice: the pad is what makes the music less clean, and the
 * race's instrument is not. Measurement had predicted exactly that, and now
 * says why — the pad adds about a decibel between 240 and 480 Hz and nothing
 * anywhere else. That band is where sound piles up without being heard as
 * anything, so a part that sits in it continuously is a veil rather than a
 * voice.
 *
 * But the checks then named what the pad was carrying, and simply deleting it
 * is not available:
 *
 *   - the final chord falls from four to seven parts down to two, on every
 *     character. The pad *is* the chord in "the ending lands together".
 *   - three characters stop growing at all — 3 > 3 > 3 > 3 — because the pad
 *     was the only part entering at the build phrase.
 *
 * So the fault is not that the pad exists. It is that it sounds all the way
 * through, in the worst band to sound all the way through in. The project
 * already believes parts should enter and leave; the pad is the one that never
 * does. Two ways out, and B stays on the page as the thing they have to beat.
 */

/* keep the pad only where the arrangement actually needs a chord: the start of
   each phrase, and the final chord */
const asEvents = {
  score(s) {
    const phrase = s.barsPerPhrase * s.barDur;
    s.tracks.pad = s.tracks.pad.filter((n) => {
      const intoPhrase = n.t - Math.round(n.t / phrase) * phrase;
      return Math.abs(intoPhrase) < 0.02 || Math.abs(n.t - s.endAt) < 0.02;
    });
  },
};

/* lift the pad as far towards the melody as the stacking rule allows — out of
   the veil band, still underneath the tune */
const lifted = {
  score(s) {
    if (!s.tracks.pad.length || !s.tracks.lead.length) return;
    const leadBottom = Math.min(...s.tracks.lead.map((n) => n.midi));
    const padTop = Math.max(...s.tracks.pad.map((n) => n.midi));
    const shift = Math.min(12, leadBottom - 1 - padTop);
    if (shift <= 0) return;
    s.tracks.pad.forEach((n) => { n.midi += shift; });
  },
};

window.VARIANTS = {

  on: 'Dame Ilsabet Cross',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Фон звучит всю тему. Версия с главной страницы.' },

    { id: 'noPad',
      label: 'B — без фона',
      note: 'Твой прошлый выбор. Остаётся на странице как то, что новым '
          + 'версиям надо превзойти — но ценой: финальный аккорд здесь '
          + 'берут всего две партии вместо семи.',
      score(s) { s.tracks.pad.length = 0; } },

    { id: 'events',
      label: 'C — фон только на опорах',
      note: 'Фон звучит на начале каждой фразы и на финальном аккорде, '
          + 'а между ними молчит. Пелена не успевает накопиться, но '
          + 'концовка и нарастание остаются на месте.',
      ...asEvents },

    { id: 'lifted',
      label: 'D — фон поднят под мелодию',
      note: 'Фон звучит так же непрерывно, но переставлен вверх — из мутной '
          + 'полосы, ближе к мелодии, всё ещё под ней. Проверка того, что '
          + 'мешала именно полоса, а не сама непрерывность.',
      ...lifted },
  ],
};
