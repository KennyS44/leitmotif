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
 * `on` names the character the page opens with — the one where the question
 * actually arises. Notes are in Russian on purpose: this page is a workbench,
 * not the product.
 *
 * Settled 2026-08-22: the second class answers in the lead's own instrument.
 * Its own timbre, even quietened, was still heard as a second tune. That is now
 * on the front page and is no longer a question.
 *
 * This round's question: how much louder the background should be. Kenny hears
 * it, but has to listen for it. The pad and the race's instrument sit about 6dB
 * under the melody; these raise both together. Only the amount changes between
 * the versions, so the answer is one letter.
 */

const lift = (db) => (p) => {
  const k = Math.pow(10, db / 20);
  p.blend.pad.gain *= k;
  p.blend.hue.gain *= k;
};

window.VARIANTS = {

  /* Dame Ilsabet has the busiest pad of the twelve and a race instrument that
     is not the pad doubled, so both halves of the question are audible on her. */
  on: 'Dame Ilsabet Cross',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Фон и расовый инструмент примерно на 6 дБ ниже мелодии. '
          + 'Версия с главной страницы.' },

    { id: 'up2',
      label: 'B — +2 дБ',
      note: 'Едва заметная прибавка. Если разницы с A почти нет — значит мало.',
      params: lift(2) },

    { id: 'up4',
      label: 'C — +4 дБ',
      note: 'Фон выходит из-за мелодии, но остаётся под ней.',
      params: lift(4) },

    { id: 'up6',
      label: 'D — +6 дБ',
      note: 'Фон вдвое громче нынешнего — почти вровень с мелодией. '
          + 'Здесь уже есть риск, что он начнёт спорить с ней за внимание.',
      params: lift(6) },
  ],
};
