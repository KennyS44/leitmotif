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

  /* with everything rendered, the map can be drawn — and the head parked where
     there is something to hear, rather than at a zero that is the same in every
     version */
  const from = drawDiff();
  if (from !== null && !Player.busy() && ui.pending === 0) {
    ui.setHead(from, Number(ui.head.max) / 100);
  }
}

/* ------------------------------------------------------- where they differ
 *
 * The reason this exists: the first time the page was used, all three versions
 * were switched between inside the opening seconds — where they are identical,
 * because the second class does not enter until the build phrase. The page
 * asked for a judgement on a stretch where there was nothing to judge.
 *
 * An edit almost never touches the whole theme. So the theme is compared to
 * itself, frame by frame, and the places where the versions actually part
 * company are drawn on the timeline. Then the head starts there. */

const FRAME = 0.4;                       /* seconds per column of the map */
const FLOOR = -30;                       /* dB below which nothing is drawn */
const CEIL = -6;                         /* dB at which the mark is solid */

/* How different the two are in each frame — in content, not in loudness.
 *
 * The first version of this measure lit up the whole theme, including a stretch
 * where the versions play exactly the same notes: removing a part changes what
 * the limiter does, so every sample shifts a little in level. That is a real
 * difference in the signal and no difference at all to a listener, and marking
 * it is how the page sent someone to compare a passage with nothing in it.
 *
 * So each frame is scaled to its best fit first. What is left over is the part
 * that no change of volume can explain — a note that is there in one version
 * and not the other, or a different instrument playing it. */
function divergence(a, b) {
  const x = a.getChannelData(0);
  const y = b.getChannelData(0);
  const n = Math.min(x.length, y.length);
  const per = Math.round(a.sampleRate * FRAME);
  const out = [];
  for (let s = 0; s < n; s += per) {
    const to = Math.min(s + per, n);
    let xy = 0;
    let yy = 0;
    let xx = 0;
    for (let i = s; i < to; i += 1) { xy += x[i] * y[i]; yy += y[i] * y[i]; xx += x[i] * x[i]; }
    /* the gain that makes b as close to a as a gain can */
    const g = yy > 1e-12 ? xy / yy : 0;
    let d2 = 0;
    for (let i = s; i < to; i += 1) {
      const d = x[i] - g * y[i];
      d2 += d * d;
    }
    /* relative, so a quiet passage is not called identical merely for being
       quiet; silence against silence is genuinely no difference */
    const db = xx > 1e-9 ? 10 * Math.log10(d2 / xx) : FLOOR;
    out.push(Math.max(0, Math.min(1, (db - FLOOR) / (CEIL - FLOOR))));
  }
  return out;
}

function drawDiff() {
  const map = el('diffmap');
  const note = el('diffnote');
  const armed = buffers[pick];
  const others = variants.map((_, i) => i).filter((i) => i !== pick && buffers[i]);
  if (!armed || !others.length) { map.innerHTML = ''; note.textContent = ''; return null; }

  const each = others.map((i) => divergence(armed, buffers[i]));
  const worst = each[0].map((_, f) => Math.max(...each.map((d) => d[f])));

  map.innerHTML = worst
    .map((v) => `<span style="opacity:${v.toFixed(2)}"></span>`).join('');

  /* the first frame where the difference is more than faint — that is where
     listening should begin, with a moment of run-up to hear it arrive */
  const first = worst.findIndex((v) => v > 0.4);
  if (first < 0) {
    note.textContent = 'Версии не расходятся нигде — сравнивать нечего.';
    return null;
  }
  let last = worst.length - 1;
  while (last > first && worst[last] <= 0.4) last -= 1;
  const from = Math.max(0, first * FRAME - 1.5);
  note.textContent = `Версии расходятся с ${Player.clockText(first * FRAME)}`
    + ` по ${Player.clockText((last + 1) * FRAME)}. Голова поставлена перед этим местом.`;
  return from;
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
    /* the map is drawn against whichever version is armed, so it is redrawn —
       but the head stays where it is, mid-comparison */
    drawDiff();
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
  el('diffmap').innerHTML = '';
  el('diffnote').textContent = '';
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
