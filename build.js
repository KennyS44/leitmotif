'use strict';

/* Build a character and hear it — every point on the map, not the fourteen I
 * happened to choose.
 *
 * The presets are twelve chosen examples plus two added to cover the classes
 * they missed, and they have the fault every chosen set has: they show what I
 * decided to show. `blind.html` works around it by rolling strangers, but a
 * roll cannot be aimed. To ask "what does a dwarf paladin actually sound like"
 * you have to be able to say dwarf, and paladin, and nothing else.
 *
 * This is also, eventually, the product's front door. README still lists a
 * character builder under "not here yet", gated behind the blind test — that
 * gate was about *finishing* a product nobody could yet judge, and this is the
 * instrument for judging it. The gallery stays where it is until the sound is
 * settled; then this becomes the way in.
 *
 * Shape of the inputs is not new: class, race and alignment required, an
 * optional subclass *or* second class but never both, and tags picked from a
 * fixed list, five at most. All of that was settled long ago and none of it is
 * free text.
 */

(function builder() {

const M = window.Mapping;
const Sheet = window.Sheet;
const Player = window.Player;
const { renderTheme, scoreFor } = window.Render;

const MAX_TAGS = 5;

const el = (id) => document.getElementById(id);
const card = el('result');

/* ------------------------------------------------------------------ words */

const EN = {
  kicker: 'Prototype · build your own',
  title: 'Build a character',
  lede: 'Class, race and alignment make the theme; tags only colour it. Every'
      + ' sheet sounds the same on every machine, so the one you build here is'
      + ' the one anybody else would hear.',
  cls: 'Class', sub: 'Subclass', second: 'Second class',
  race: 'Race', alignment: 'Alignment',
  traits: 'Traits', looks: 'Looks',
  none: '—',
  fork: 'A subclass bends the motif this character already has; a second class'
      + ' brings its own. They are different statements, so only one at a time.',
  left: (n) => `${n} left`,
  full: 'five is the limit',
  play: 'Play theme', stop: 'Stop', preparing: 'preparing…',
  roll: 'Roll a stranger', clear: 'Clear tags',
  back: '← back to the themes',
  fine: 'Nothing is stored and nothing is sent anywhere: the theme is built in'
      + ' this page out of the sheet above, every time.',
};

const RU = {
  kicker: 'Прототип · собери своего',
  title: 'Собрать персонажа',
  lede: 'Класс, раса и мировоззрение делают тему; теги её только красят. Любой'
      + ' лист звучит одинаково на любой машине — значит, собранное здесь'
      + ' услышит и любой другой.',
  cls: 'Класс', sub: 'Подкласс', second: 'Второй класс',
  race: 'Раса', alignment: 'Мировоззрение',
  traits: 'Черты', looks: 'Внешность',
  none: '—',
  fork: 'Подкласс отгибает мотив, который у персонажа уже есть; второй класс'
      + ' приносит свой. Это разные высказывания, поэтому только одно из двух.',
  left: (n) => `осталось ${n}`,
  full: 'больше пяти нельзя',
  play: 'Слушать тему', stop: 'Стоп', preparing: 'собираю…',
  roll: 'Случайный персонаж', clear: 'Очистить теги',
  back: '← к темам',
  fine: 'Ничего не сохраняется и никуда не уходит: тема собирается прямо на'
      + ' этой странице из листа выше, каждый раз заново.',
};

const t = () => (Sheet.lang === 'ru' ? RU : EN);

/* --------------------------------------------------------------- the sheet */

const ch = {
  name: 'Someone',
  cls: 'paladin', sub: null, second: undefined,
  race: 'human', alignment: 'LG',
  traits: [], looks: [], blurb: null,
};

/* The genre layer still lives in the workbench file, because it is still being
   chosen. Reading it from there keeps one copy of the decisions rather than a
   second that drifts — and when the sound is settled it moves into mapping.js
   and this line goes away. */
const genre = (window.VARIANTS && window.VARIANTS.list.find((v) => v.id === 'chosen')) || null;

const ui = Player.transport(card, 1, {
  state(playing) { el('play').textContent = playing ? t().stop : t().play; },
});

let buffer = null;
let generation = 0;

/* ------------------------------------------------------------------ inputs */

function option(value, label, selected) {
  return `<option value="${value}"${selected ? ' selected' : ''}>${label}</option>`;
}

function fillSelects() {
  const lab = (kind, k, fallback) => Sheet.label(kind, k, fallback);

  el('cls').innerHTML = Object.keys(M.CLASSES)
    .map((k) => ({ k, name: lab('classes', k, M.CLASSES[k].label) }))
    .sort((a, b) => a.name.localeCompare(b.name, Sheet.lang))
    .map((x) => option(x.k, x.name, x.k === ch.cls)).join('');

  el('race').innerHTML = Object.keys(M.RACES)
    .map((k) => ({ k, name: lab('races', k, M.RACES[k].label) }))
    .sort((a, b) => a.name.localeCompare(b.name, Sheet.lang))
    .map((x) => option(x.k, x.name, x.k === ch.race)).join('');

  el('alignment').innerHTML = Object.keys(M.ALIGNMENTS)
    .map((k) => option(k, lab('alignments', k, M.ALIGNMENTS[k].label), k === ch.alignment))
    .join('');

  fillFork();
}

/* Subclass and second class are one choice wearing two controls: picking in
   either empties the other. The rule is old — "a subclass or a second class,
   not both, they are different statements" — and the form is where it should be
   visible rather than silently applied afterwards. */
function fillFork() {
  const subs = M.SUBCLASSES[ch.cls];
  const lab = (k) => Sheet.label('subclasses', k, subs[k].label);
  el('sub').innerHTML = option('', t().none, !ch.sub)
    + (subs ? Object.keys(subs).map((k) => option(k, lab(k), k === ch.sub)).join('') : '');
  el('sub').disabled = !subs;

  el('second').innerHTML = option('', t().none, !ch.second)
    + Object.keys(M.CLASSES).filter((k) => k !== ch.cls)
      .map((k) => ({ k, name: Sheet.label('classes', k, M.CLASSES[k].label) }))
      .sort((a, b) => a.name.localeCompare(b.name, Sheet.lang))
      .map((x) => option(x.k, x.name, x.k === ch.second)).join('');
}

function fillTags(which) {
  const table = which === 'traits' ? M.TRAITS : M.LOOKS;
  const picked = ch[which];
  const atLimit = picked.length >= MAX_TAGS;
  el(which).innerHTML = Object.keys(table)
    .map((k) => ({ k, name: Sheet.label(which, k, table[k].label) }))
    .sort((a, b) => a.name.localeCompare(b.name, Sheet.lang))
    .map((x) => {
      const on = picked.includes(x.k);
      return `<button type="button" class="tagpick__btn" data-tag="${x.k}"
        aria-pressed="${on}"${!on && atLimit ? ' disabled' : ''}>${x.name}</button>`;
    }).join('');
  const left = MAX_TAGS - picked.length;
  el(`l-${which}`).textContent = `${t()[which]} · ${left ? t().left(left) : t().full}`;
}

/* ----------------------------------------------------------------- the play */

function describe() {
  const { p } = scoreFor(ch, genre);
  el('sheet').textContent = Sheet.line(ch, p);
  el('chosen-tags').innerHTML = Sheet.tags(ch).map((x) => `<li>${x}</li>`).join('');
  const voice = (v) => Sheet.label('voices', v, v);
  const parts = [p.lead, p.pad, p.counter, p.hue].filter(Boolean).map(voice).join(', ');
  const kit = p.perc ? Sheet.label('kits', p.perc, p.perc) : '—';
  el('why').textContent = `${parts} · ${kit} · `
    + `${Sheet.label('modes', p.modeName, p.modeName)} · ${Math.round(p.tempo)} bpm`;
}

/* A change to the sheet is a different piece of music, so whatever was rendered
   stops being an answer. Stopping first is not politeness — it is the only way
   the button and the sound cannot disagree.
 *
 * The wait before rendering is not decoration either. Building forty seconds of
 * audio costs real seconds, and picking five tags is five edits in a row: with
 * no pause it starts five renders and throws four of them away. The sheet
 * updates instantly; only the sound waits for the hand to stop. */
const SETTLE = 400;
let settleTimer = null;

function describeNow() {
  describe();
  el('play').disabled = true;
  el('ready').textContent = t().preparing;
}

function refresh() {
  Player.stop();
  buffer = null;
  generation += 1;
  describeNow();
  clearTimeout(settleTimer);
  settleTimer = setTimeout(render, SETTLE);
}

async function render() {
  const mine = generation;
  const made = await renderTheme(ch, genre);
  if (mine !== generation) return;
  buffer = made;
  ui.rescale(buffer.duration);
  ui.setHead(0, buffer.duration);
  el('play').disabled = false;
  el('ready').textContent = '';
}

/* ----------------------------------------------------------------- wiring */

el('cls').addEventListener('change', (e) => {
  ch.cls = e.target.value;
  ch.sub = null;
  if (ch.second === ch.cls) ch.second = undefined;
  fillFork();
  refresh();
});

el('sub').addEventListener('change', (e) => {
  ch.sub = e.target.value || null;
  if (ch.sub) { ch.second = undefined; fillFork(); }
  refresh();
});

el('second').addEventListener('change', (e) => {
  ch.second = e.target.value || undefined;
  if (ch.second) { ch.sub = null; fillFork(); }
  refresh();
});

el('race').addEventListener('change', (e) => { ch.race = e.target.value; refresh(); });
el('alignment').addEventListener('change', (e) => { ch.alignment = e.target.value; refresh(); });

['traits', 'looks'].forEach((which) => {
  el(which).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const tag = b.dataset.tag;
    const at = ch[which].indexOf(tag);
    if (at >= 0) ch[which].splice(at, 1);
    else if (ch[which].length < MAX_TAGS) ch[which].push(tag);
    fillTags(which);
    refresh();
  });
});

el('play').addEventListener('click', () => {
  if (Player.isLive(ui)) { Player.stop(); return; }
  if (buffer) Player.start(buffer, ui, ui.pending);
});

el('roll').addEventListener('click', () => {
  const rolled = window.rollCharacter();
  Object.assign(ch, {
    cls: rolled.cls, sub: rolled.sub, second: rolled.second,
    race: rolled.race, alignment: rolled.alignment,
    traits: rolled.traits.slice(0, MAX_TAGS), looks: rolled.looks.slice(0, MAX_TAGS),
  });
  fillSelects();
  fillTags('traits'); fillTags('looks');
  refresh();
});

el('clear').addEventListener('click', () => {
  ch.traits = []; ch.looks = [];
  fillTags('traits'); fillTags('looks');
  refresh();
});

document.querySelector('.lang').addEventListener('click', (e) => {
  const pick = e.target.closest('button');
  if (!pick || pick.dataset.lang === Sheet.lang) return;
  Sheet.set(pick.dataset.lang);
  words();
  fillSelects();
  fillTags('traits'); fillTags('looks');
  describe();
});

function words() {
  document.documentElement.lang = Sheet.lang;
  el('kicker').textContent = t().kicker;
  el('title').textContent = t().title;
  el('lede').textContent = t().lede;
  ['cls', 'sub', 'second', 'race', 'alignment'].forEach((k) => {
    el(`l-${k}`).textContent = t()[k];
  });
  el('n-fork').textContent = t().fork;
  el('roll').textContent = t().roll;
  el('clear').textContent = t().clear;
  el('back').textContent = t().back;
  el('fine').textContent = t().fine;
  el('play').textContent = Player.isLive(ui) ? t().stop : t().play;
  [...document.querySelectorAll('.lang button')].forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === Sheet.lang));
  });
}

words();
fillSelects();
fillTags('traits');
fillTags('looks');
refresh();

}());
