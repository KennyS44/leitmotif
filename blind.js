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
  modes: { both: 'Class + race', class: 'Class only', race: 'Race only' },
  fine: {
    both: 'The characters are rolled fresh every round, never the twelve from the'
        + ' front page — those have been heard too often to be a test of anything'
        + ' but memory. The four sheets always differ in class and in race.',
    class: 'Diagnostic. The four sheets are one character with the class swapped —'
        + ' same race, same alignment, same tags, no subclass and no second class.'
        + ' It asks one thing: is the class alone audible?',
    race: 'Diagnostic. The four sheets are one character with the race swapped,'
        + ' everything else held still. It asks one thing: is the race alone'
        + ' audible?',
  },
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
  modes: { both: 'Класс + раса', class: 'Только класс', race: 'Только раса' },
  fine: {
    both: 'Персонажи бросаются заново каждый раунд — не двенадцать с главной'
        + ' страницы: их ты слышал слишком часто, и это был бы тест памяти, а не'
        + ' карты. Четыре листа всегда различаются классом и расой.',
    class: 'Диагностика. Четыре листа — это один персонаж с подменённым классом:'
        + ' та же раса, то же мировоззрение, те же теги, без подкласса и без'
        + ' второго класса. Вопрос ровно один: слышен ли класс сам по себе?',
    race: 'Диагностика. Четыре листа — это один персонаж с подменённой расой,'
        + ' всё остальное остаётся неподвижным. Вопрос ровно один: слышна ли раса'
        + ' сама по себе?',
  },
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
let mode = 'both';       /* both | class | race — see drawOne */
const log = [];          /* { correct, sheet, truth, picked } — sheets kept whole
                            so a later question can be asked of an earlier run */
let question = null;     /* { sheets, answer, buffer } */
let queued = null;       /* the next one, rendered while this one is answered */
let answered = false;

const ui = Player.transport(el('quiz'), 1, {
  state(playing) { el('play').textContent = playing ? t().stop : t().play; },
});

/* Four strangers who cannot be told apart by elimination: no repeated class and
   no repeated race. Everything else is left to the dice. */
function drawBoth() {
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

/* A diagnostic round: four sheets identical but for the one field under test.
 *
 * The headline test varies class and race together, so a wrong pick differs
 * from the truth in both fields at once and cannot say which one went unheard.
 * That is fine for asking "is the map audible" and useless for asking "which
 * half of it is audible". Holding everything else still is the only way to put
 * the question to one field.
 *
 * The class rounds carry no subclass and no second class. A bare class is the
 * commonest character there is, and it is also the only way to hear what the
 * class itself sounds like rather than what a pair of them sounds like. */
function drawOne(field) {
  const M = window.Mapping;
  const base = window.rollCharacter();
  if (field === 'cls') { base.sub = null; base.second = undefined; }

  const pool = keys(field === 'cls' ? M.CLASSES : M.RACES)
    .filter((v) => v !== base[field]);
  const chosen = [base[field]];
  while (chosen.length < OPTIONS && pool.length) {
    chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  /* every sheet needs its own name, or the line-up reads as one character;
     the names come from throwaway rolls and touch nothing that sounds */
  const sheets = chosen.map((v) => ({ ...base, [field]: v,
    name: window.rollCharacter().name }));

  /* the truth is built first; it must not always be offered first */
  const answer = Math.floor(Math.random() * sheets.length);
  [sheets[0], sheets[answer]] = [sheets[answer], sheets[0]];
  return { sheets, answer };
}

function keys(o) { return Object.keys(o); }

function draw() {
  return mode === 'both' ? drawBoth() : drawOne(mode === 'class' ? 'cls' : 'race');
}

/* A read-only way in for the checks. A diagnostic decides which field the
   mapping gets rebuilt around, so "the four sheets differ in one field only"
   has to be something a test can assert rather than something I claim. */
window.__blind = () => ({ mode, question, log });

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
  log.push({
    correct: ok,
    sheet: Sheet.line(question.sheets[question.answer]),
    truth: question.sheets[question.answer],
    picked: question.sheets[i],
  });
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
/* Each mode keeps its own total. A diagnostic asks an easier question — one
   field varying instead of two — so folding its rounds into the headline tally
   would inflate the one number this repository exists to produce. The headline
   keeps the original key, so the runs already recorded are not lost. */
const tallyKey = () => (mode === 'both' ? 'leitmotif.blind' : `leitmotif.blind.${mode}`);

function tallyLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(tallyKey()) || '{}');
    return { right: raw.right || 0, total: raw.total || 0, runs: raw.runs || 0 };
  } catch (e) { return { right: 0, total: 0, runs: 0 }; }
}

function tallySave(tally) {
  localStorage.setItem(tallyKey(), JSON.stringify(tally));
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

/* Changing what a round varies changes what the score means, so the run in
   progress is abandoned rather than continued under a new rule. */
el('mode').addEventListener('click', (e) => {
  const pick = e.target.closest('button');
  if (!pick || pick.dataset.mode === mode) return;
  mode = pick.dataset.mode;
  window.location.hash = mode === 'both' ? '' : mode;
  window.location.reload();
});

function words() {
  document.documentElement.lang = Sheet.lang;
  el('kicker').textContent = t().kicker;
  el('lede').textContent = t().lede;
  el('back').textContent = t().back;
  el('fine').textContent = t().fine[mode];
  [...document.querySelectorAll('#mode button')].forEach((b) => {
    b.textContent = t().modes[b.dataset.mode];
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  });
  el('ask').textContent = t().ask;
  el('play').textContent = Player.isLive(ui) ? t().stop : t().play;
  el('next').textContent = t().next;
  el('again').textContent = t().again;
  if (question) el('progress').textContent = t().progress(round + 1, ROUNDS, right);
  [...document.querySelectorAll('.lang button')].forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === Sheet.lang));
  });
}

const fromHash = window.location.hash.replace('#', '');
if (fromHash === 'class' || fromHash === 'race') mode = fromHash;

words();
nextRound();

}());
