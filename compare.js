'use strict';

/* The workbench. One character, one timeline, two or three versions of the same
   edit — and switching between them does not restart anything.
 *
 * The reason it is built this way: judging two versions played from the start,
 * one after the other, is judging memory rather than sound. Thirty seconds in,
 * the first one is gone. Kept on one timeline, the same bar can be heard twice
 * a second apart, and the difference is either there or it is not.
 *
 * Every version of the current character is rendered up front, so a switch is
 * instant. Rendering on demand would put a second of silence exactly where the
 * comparison happens.
 */

(function bench() {

const Player = window.Player;
const { characterToParams, CLASSES, RACES, ALIGNMENTS } = window.Mapping;
const { renderTheme, scoreFor } = window.Render;
const variants = window.VARIANTS.list;

const el = (id) => document.getElementById(id);
const card = el('bench');

/* A round's question usually only arises on one kind of character, so the set
   of variants names the one to open with rather than starting at the top of a
   list where the edit may do nothing at all. */
const opensWith = Math.max(0,
  window.PRESETS.findIndex((c) => c.name === window.VARIANTS.on));
let ch = window.PRESETS[opensWith];
let pick = 0;                 /* which version is armed */
let generation = 0;           /* bumped on every character change */
let buffers = [];             /* one per variant, filled as they render */

const ui = Player.transport(card, scoreFor(ch, variants[0]).score.duration, {
  /* seeking while stopped only moves the head; nothing starts on its own */
  state(playing) { el('play').textContent = playing ? 'Stop' : 'Play'; },
});

/* ------------------------------------------------------------------ sheet */

function sheetLine() {
  const one = (k) => CLASSES[k].label;
  const cls = one(ch.cls) + (ch.second ? ` / ${one(ch.second)}` : '');
  return `${ch.name} — ${RACES[ch.race].label} ${cls} · ${ALIGNMENTS[ch.alignment].label}`;
}

function whyLine() {
  const p = characterToParams(ch);
  const parts = [p.lead, p.pad, p.counter, p.hue].filter(Boolean).join(', ');
  return `${parts} · ${p.modeName} · ${p.beats} beats at ${p.tempo} bpm`;
}

/* ---------------------------------------------------------------- versions */

function drawVersions() {
  el('versions').innerHTML = variants.map((v, i) => `
    <button type="button" class="version" data-i="${i}"
            aria-pressed="${i === pick}">${v.label}</button>`).join('');
  el('note').textContent = variants[pick].note || '';
}

/* Rendering is sequential rather than all at once: three offline contexts
   competing for the same thread finish no sooner and stall the page while they
   do it. The armed version is rendered first, so playing is possible before the
   rest are ready. */
async function prepare() {
  const mine = generation;
  const order = [pick, ...variants.map((_, i) => i).filter((i) => i !== pick)];
  for (const i of order) {
    if (mine !== generation) return;
    if (!buffers[i]) {
      el('ready').textContent = variants.length > 1
        ? `preparing ${order.indexOf(i) + 1}/${variants.length}…` : 'preparing…';
      const buf = await renderTheme(ch, variants[i]);
      if (mine !== generation) return;
      buffers[i] = buf;
    }
  }
  el('ready').textContent = '';
}

function choose(i) {
  if (i === pick || !variants[i]) return;
  pick = i;
  drawVersions();
  const dur = scoreFor(ch, variants[i]).score.duration;
  ui.rescale(dur);
  if (buffers[i]) {
    /* the whole point of the page: same moment, other version */
    if (Player.isLive(ui)) Player.swap(buffers[i]);
    else ui.setHead(Math.min(ui.pending, dur), dur);
  } else {
    el('ready').textContent = 'not ready yet…';
    prepare();
  }
}

/* --------------------------------------------------------------- character */

function load(next) {
  Player.stop();
  ch = next;
  generation += 1;
  buffers = [];
  el('sheet').textContent = sheetLine();
  el('why').textContent = whyLine();
  const dur = scoreFor(ch, variants[pick]).score.duration;
  ui.rescale(dur);
  ui.setHead(0, dur);
  prepare();
}

/* ------------------------------------------------------------------ wiring */

el('who').innerHTML = window.PRESETS
  .map((c, i) => `<option value="${i}"${i === opensWith ? ' selected' : ''}>${c.name}</option>`)
  .join('');
el('who').addEventListener('change', (e) => load(window.PRESETS[Number(e.target.value)]));

el('roll').addEventListener('click', () => {
  el('who').selectedIndex = -1;
  load(window.rollCharacter());
});

el('versions').addEventListener('click', (e) => {
  const b = e.target.closest('.version');
  if (b) choose(Number(b.dataset.i));
});

el('play').addEventListener('click', async () => {
  if (Player.isLive(ui)) { Player.stop(); return; }
  if (!buffers[pick]) { await prepare(); }
  if (buffers[pick]) Player.start(buffers[pick], ui, ui.pending);
});

/* Hands stay on the keyboard: the comparison is a lot of switching. */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  if (e.key === ' ') { e.preventDefault(); el('play').click(); return; }
  if (e.key >= '1' && e.key <= '9') { choose(Number(e.key) - 1); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const step = e.key === 'ArrowLeft' ? -1 : 1;
    const at = Math.max(0, (Player.isLive(ui) ? Player.position() : ui.pending) + step);
    ui.setHead(at, Number(ui.head.max) / 100);
    Player.seek(ui, at);
  }
});

drawVersions();
load(ch);

}());
