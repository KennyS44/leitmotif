'use strict';

/* The only question this repository exists to answer, asked properly.
 *
 * Everything else here — the mapping, the arrangement, the A/B page — waits on
 * one thing: given a theme and no name, can a listener tell whose it is? Until
 * that has a number, every improvement to the sound is an act of faith.
 *
 * Two decisions make this a test rather than a demonstration:
 *
 * The characters are **rolled, never the presets**. The twelve on the front
 * page have been listened to many times; picking Ser Aldric's theme out of a
 * line-up would measure memory, not mapping. A stranger cannot be remembered,
 * and it is what the rules actually do rather than what I chose to show.
 *
 * The four sheets in a question **differ in class and in race**, so the answer
 * is never decided by a coin toss between two characters the rules could not
 * possibly separate. Alignment and tags are left to fall where they fall: they
 * are supposed to be audible too, and rigging them would flatter the result.
 *
 * Chance is one in four. A score near three of ten means the map is not
 * audible, and no amount of polishing the pad will change that.
 */

(function blind() {

const Player = window.Player;
const Sheet = window.Sheet;
const { renderTheme } = window.Render;

const ROUNDS = 10;
const OPTIONS = 4;

const el = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ words */

const EN = {
  kicker: 'The one question · step 1',
  lede: 'A theme plays with no name on it. Four character sheets; one of them is'
      + ' the one it was written from. Ten rounds. Guessing gives two or three'
      + ' right — anything well above that means the map is audible.',
  play: 'Play theme',
  stop: 'Stop',
  preparing: 'preparing…',
  progress: (n, total, right) => `Round ${n} of ${total} · ${right} right so far`,
  ask: 'Whose theme is this?',
  right: 'Right.',
  wrong: 'No — it was this one.',
  next: 'Next round',
  done: (right, total) => `${right} of ${total}`,
  breakdown: (right, total, chance, first, second) =>
    `Chance alone gives about ${chance} of ${total}. You scored ${right}.`
    + ` First half ${first}, second half ${second}.`,
  running: (right, total, runs, chance, pct) =>
    `Across ${runs} run${runs === 1 ? '' : 's'}: ${right} of ${total}.`
    + ` Guessing would give about ${chance}. The chance of scoring this well or`
    + ` better by luck alone is ${pct}%.`,
  again: 'Run it again',
  back: '← back to the themes',
  fine: 'The characters are rolled fresh every round, never the twelve from the'
      + ' front page — those have been heard too often to be a test of anything'
      + ' but memory. The four sheets always differ in class and in race.',
};

const RU = {
  kicker: 'Главный вопрос · шаг 1',
  lede: 'Играет тема без имени. Четыре листа персонажа; с одного из них она и'
      + ' написана. Десять раундов. Наугад выходит два-три попадания — всё, что'
      + ' заметно выше, означает, что карта слышна.',
  play: 'Слушать тему',
  stop: 'Стоп',
  preparing: 'собираю…',
  progress: (n, total, right) => `Раунд ${n} из ${total} · попаданий: ${right}`,
  ask: 'Чья это тема?',
  right: 'Верно.',
  wrong: 'Нет — вот эта.',
  next: 'Дальше',
  done: (right, total) => `${right} из ${total}`,
  breakdown: (right, total, chance, first, second) =>
    `Наугад вышло бы примерно ${chance} из ${total}. У тебя ${right}.`
    + ` Первая половина ${first}, вторая ${second}.`,
  running: (right, total, runs, chance, pct) =>
    `За ${runs} ${plural(runs, ['прогон', 'прогона', 'прогонов'])} всего:`
    + ` ${right} из ${total}.`
    + ` Наугад вышло бы примерно ${chance}. Вероятность набрать столько же или`
    + ` больше по чистой удаче — ${pct}%.`,
  again: 'Ещё раз',
  back: '← к темам',
  fine: 'Персонажи бросаются заново каждый раунд — не двенадцать с главной'
      + ' страницы: их ты слышал слишком часто, и это был бы тест памяти, а не'
      + ' карты. Четыре листа всегда различаются классом и расой.',
};

/* Russian picks the form by the last digit: 1 прогон, 2 прогона, 5 прогонов. */
function plural(n, forms) {
  const last = n % 10;
  const tens = n % 100;
  if (last === 1 && tens !== 11) return forms[0];
  if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) return forms[1];
  return forms[2];
}

const t = () => (Sheet.lang === 'ru' ? RU : EN);

/* ------------------------------------------------------------- the rounds */

let round = 0;
let right = 0;
const log = [];          /* { correct: bool, sheet: string } */
let question = null;     /* { sheets, answer, buffer } */
let queued = null;       /* the next one, rendered while this one is answered */
let answered = false;

const ui = Player.transport(el('quiz'), 1, {
  state(playing) { el('play').textContent = playing ? t().stop : t().play; },
});

/* Four strangers who cannot be told apart by elimination: no repeated class and
   no repeated race. Everything else is left to the dice. */
function draw() {
  const sheets = [];
  const classes = new Set();
  const races = new Set();
  let guard = 0;
  while (sheets.length < OPTIONS && guard < 500) {
    guard += 1;
    const ch = window.rollCharacter();
    if (classes.has(ch.cls) || races.has(ch.race)) continue;
    classes.add(ch.cls);
    races.add(ch.race);
    sheets.push(ch);
  }
  return { sheets, answer: Math.floor(Math.random() * sheets.length) };
}

async function build() {
  const q = draw();
  q.buffer = await renderTheme(q.sheets[q.answer]);
  return q;
}

function drawOptions(reveal) {
  el('options').innerHTML = question.sheets.map((ch, i) => {
    const state = !reveal ? ''
      : (i === question.answer ? ' option--right'
        : (i === question.picked ? ' option--wrong' : ''));
    return `
      <button type="button" class="option${state}" data-i="${i}"
              ${reveal ? 'disabled' : ''}>
        <span class="option__line">${Sheet.line(ch)}</span>
        <span class="option__tags">${Sheet.tags(ch).join(' · ')}</span>
      </button>`;
  }).join('');
}

function show() {
  answered = false;
  el('progress').textContent = t().progress(round + 1, ROUNDS, right);
  el('ask').textContent = t().ask;
  el('verdict').textContent = '';
  el('next').hidden = true;
  el('next').textContent = t().next;
  drawOptions(false);
  ui.rescale(question.buffer.duration);
  ui.setHead(0, question.buffer.duration);
  el('play').disabled = false;
  el('ready').textContent = '';
}

async function nextRound() {
  Player.stop();
  el('play').disabled = true;
  el('ready').textContent = t().preparing;
  question = queued ? await queued : await build();
  queued = null;
  show();
  /* the round after this one is rendered while this one is being answered, so
     the wait is spent thinking rather than watching a spinner */
  queued = build();
}

function answer(i) {
  if (answered) return;
  answered = true;
  question.picked = i;
  const ok = i === question.answer;
  if (ok) right += 1;
  log.push({ correct: ok, sheet: Sheet.line(question.sheets[question.answer]) });
  el('verdict').textContent = ok ? t().right : t().wrong;
  el('verdict').className = `verdict ${ok ? 'verdict--right' : 'verdict--wrong'}`;
  drawOptions(true);
  el('progress').textContent = t().progress(round + 1, ROUNDS, right);
  el('next').hidden = false;
  el('next').focus();
}

/* ------------------------------------------------------------ the evidence
 *
 * Ten rounds is not enough to answer anything. Five out of ten against a chance
 * of two and a half looks like a result and is not one: pure guessing reaches
 * five or better about once in thirteen tries. Rather than demand a long sitting
 * in one go, every run is added to a running total, so ten rounds whenever there
 * is time accumulate into an answer.
 *
 * The number reported is the probability of scoring at least this well by
 * guessing alone. Small means the map is audible; near a half means nothing has
 * been shown either way. */
function tallyLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem('leitmotif.blind') || '{}');
    return { right: raw.right || 0, total: raw.total || 0, runs: raw.runs || 0 };
  } catch (e) { return { right: 0, total: 0, runs: 0 }; }
}

function tallySave(tally) {
  localStorage.setItem('leitmotif.blind', JSON.stringify(tally));
}

/* P(X >= hits) for X binomial(n, 1/OPTIONS), summed in logs so a long total
   does not overflow a factorial */
function byChance(hits, n) {
  const p = 1 / OPTIONS;
  const logs = [0];
  for (let i = 1; i <= n; i += 1) logs[i] = logs[i - 1] + Math.log(i);
  let sum = 0;
  for (let k = hits; k <= n; k += 1) {
    sum += Math.exp(logs[n] - logs[k] - logs[n - k]
      + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  return Math.min(1, sum);
}

function finish() {
  Player.stop();
  el('quiz').hidden = true;
  el('result').hidden = false;
  const half = Math.floor(ROUNDS / 2);
  const count = (from, to) => log.slice(from, to).filter((x) => x.correct).length;
  el('score').textContent = t().done(right, ROUNDS);
  el('breakdown').textContent = t().breakdown(right, ROUNDS,
    Math.round(ROUNDS / OPTIONS), `${count(0, half)}/${half}`,
    `${count(half, ROUNDS)}/${ROUNDS - half}`);

  /* counted once, however many times the result screen is redrawn */
  if (!finish.counted) {
    finish.counted = true;
    const tally = tallyLoad();
    tally.right += right;
    tally.total += ROUNDS;
    tally.runs += 1;
    tallySave(tally);
    finish.tally = tally;
  }
  const all = finish.tally;
  el('running').textContent = t().running(all.right, all.total, all.runs,
    (all.total / OPTIONS).toFixed(1),
    (byChance(all.right, all.total) * 100).toFixed(1));
  el('log').innerHTML = log
    .map((x, i) => `<li class="${x.correct ? 'tag--right' : 'tag--wrong'}">`
      + `${i + 1}. ${x.sheet}</li>`).join('');
  el('again').textContent = t().again;
}

/* ------------------------------------------------------------------ wiring */

el('play').addEventListener('click', () => {
  if (Player.isLive(ui)) { Player.stop(); return; }
  Player.start(question.buffer, ui, ui.pending);
});

el('options').addEventListener('click', (e) => {
  const b = e.target.closest('.option');
  if (b && !b.disabled) answer(Number(b.dataset.i));
});

el('next').addEventListener('click', async () => {
  round += 1;
  if (round >= ROUNDS) { finish(); return; }
  await nextRound();
});

el('again').addEventListener('click', () => { window.location.reload(); });

document.querySelector('.lang').addEventListener('click', (e) => {
  const pick = e.target.closest('button');
  if (!pick || pick.dataset.lang === Sheet.lang) return;
  Sheet.set(pick.dataset.lang);
  words();
  if (!el('result').hidden) finish(); else drawOptions(answered);
});

function words() {
  document.documentElement.lang = Sheet.lang;
  el('kicker').textContent = t().kicker;
  el('lede').textContent = t().lede;
  el('back').textContent = t().back;
  el('fine').textContent = t().fine;
  el('ask').textContent = t().ask;
  el('play').textContent = Player.isLive(ui) ? t().stop : t().play;
  el('next').textContent = t().next;
  el('again').textContent = t().again;
  if (question) el('progress').textContent = t().progress(round + 1, ROUNDS, right);
  [...document.querySelectorAll('.lang button')].forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === Sheet.lang));
  });
}

words();
nextRound();

}());
