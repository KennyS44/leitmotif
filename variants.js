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
 * This round is a calibration, not a proposal.
 *
 * Asked for the background "a little louder", I offered +2, +4 and +6 dB and
 * Kenny heard no difference at all — including at +6. So I measured what the
 * background is worth in the mix: turning it off *completely* changes the audio
 * by about 9 dB, and +6 dB changes it by about 11. The two edits are the same
 * size. Something that far apart in intent and that close in effect means level
 * is probably the wrong knob, and no amount of turning it will help.
 *
 * So this set does not ask "how much". It asks whether the knob does anything
 * at all: silence against a deliberate excess, with the part on its own first
 * so there is no doubt what to listen for.
 */

const gain = (db) => (p) => {
  const k = db === null ? 0 : Math.pow(10, db / 20);
  p.blend.pad.gain *= k;
  p.blend.hue.gain *= k;
};

window.VARIANTS = {

  /* Dame Ilsabet has the busiest pad of the twelve — 60 notes — so if the
     background is inaudible anywhere, it is inaudible here. */
  on: 'Dame Ilsabet Cross',

  list: [
    { id: 'now',
      label: 'A — как сейчас',
      note: 'Версия с главной страницы. Фон и расовый инструмент примерно '
          + 'на 6 дБ ниже мелодии.' },

    { id: 'off',
      label: 'B — фона нет совсем',
      note: 'Ноль. Не предложение, а нижняя точка отсчёта: если A и B звучат '
          + 'одинаково, то фон сейчас не делает ничего, и прибавлять его '
          + 'бессмысленно — надо менять не громкость.',
      params: gain(null) },

    { id: 'loud',
      label: 'C — фон +12 дБ',
      note: 'Заведомо перебор, вчетверо громче нынешнего. Верхняя точка '
          + 'отсчёта: если и C не отличается от A, значит фон замаскирован '
          + 'мелодией и его не слышно ни на какой громкости.',
      params: gain(12) },

    { id: 'solo',
      label: 'D — только фон',
      aid: true,
      note: 'Не вариант, а подсказка: мелодия, бас и барабаны убраны, остались '
          + 'только фон и расовый инструмент. Послушай один раз, чтобы знать, '
          + 'что именно искать в A, B и C.',
      score(s) {
        ['lead', 'counter', 'bass', 'perc'].forEach((k) => { s.tracks[k].length = 0; });
      } },
  ],
};
