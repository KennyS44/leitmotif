'use strict';

/* The versions the A/B page puts side by side.
 *
 * This is the one file that is rewritten every round. When an edit has a degree
 * to it — "soften it, but only a little" — guessing the amount costs a whole
 * round: I pick a number, you listen, you say "not that much". Instead I put
 * two or three amounts here and you answer with a letter.
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
 */

window.VARIANTS = {

  /* The question left open last round: on multiclass characters the second
     class may still be heard as a second tune. It was quietened, not removed —
     and quietening a voice that has its own timbre does not stop it being a
     separate voice. Two ways further, and both have a real cost. */
  on: 'Ogrim Stoneback',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Второй класс отвечает своим инструментом, прижатым по уровню. '
          + 'Версия с главной страницы.' },

    { id: 'sameVoice',
      label: 'B — тем же инструментом',
      note: 'Второй класс говорит то же самое, но инструментом ведущего. '
          + 'Он остаётся слышен как ответ и перестаёт быть отдельным тембром. '
          + 'Цена: мультикласс теряет собственный цвет.',
      params(p) {
        p.counter = null;                     /* music.js falls back to the lead */
        p.blend.counter = { gain: 1, tone: 0 };   /* nothing to cap: it is the lead */
      } },

    { id: 'gone',
      label: 'C — без него',
      note: 'Второго голоса нет совсем. Не предложение, а замер: '
          + 'слышно ли, что что-то пропало. Если нет — он не нужен.',
      score(s) { s.tracks.counter.length = 0; } },
  ],
};
