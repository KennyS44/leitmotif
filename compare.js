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
const Sheet = window.Sheet;
Sheet.use('ru');   /* the bench reads in Russian, without changing the site's setting */
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
  state(playing) { el('play').textContent = playing ? 'Стоп' : 'Играть'; },
});

/* ------------------------------------------------------------------ sheet */

/* The bench reads in Russian, like every other word on this page. It used to
   take the labels straight out of mapping.js, which are English — so the one
   line telling you which class you are listening to was the one line you had to
   translate in your head, at exactly the moment you were being asked to judge
   whether the class is audible. `Sheet` already does this properly for the
   other two pages; it just was not loaded here. */
function sheetLine() {
  /* describes the character as *heard*, not as picked — with layers switched
     off the two are different, and a line that showed the original would be
     the workbench lying at the exact moment it is being trusted */
  const c = shown();
  const over = ((Sheet.dict() || {}).presets || {})[ch.name];
  const off = Object.keys(strip).filter((k) => strip[k]).length;
  const name = (over && over.name) || ch.name;
  return `${name} — ${Sheet.line(c)}${off ? ` · снято слоёв: ${off}` : ''}`;
}

/* The armed version's parameters, not the character's. A variant that changes
   the instruments used to be described by this line as though it had not: the
   page said "harp, glass" while a lute and an organ were playing. A label that
   contradicts the sound is worse than no label, because the ear is being asked
   to judge exactly these things. */
function whyLine() {
  const { p } = scoreFor(shown(), variants[pick]);
  const voice = (v) => Sheet.label('voices', v, v);
  const parts = [p.lead, p.pad, p.counter, p.hue].filter(Boolean).map(voice).join(', ');
  const kit = p.perc ? Sheet.label('kits', p.perc, p.perc) : 'без ударных';
  const swung = p.swing ? `, со сдвигом ${p.swing}` : '';
  return `${parts} · ${kit} · ${Sheet.label('modes', p.modeName, p.modeName)} лад`
    + ` · ${p.beats} доли, ${Math.round(p.tempo)} уд/мин${swung}`;
}

/* ---------------------------------------------------------------- versions */

function drawVersions() {
  el('versions').innerHTML = variants.map((v, i) => `
    <button type="button" class="version${v.aid ? ' version--aid' : ''}" data-i="${i}"
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
        ? `собираю ${order.indexOf(i) + 1}/${variants.length}…` : 'собираю…';
      const buf = await renderTheme(shown(), variants[i]);
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
  /* listening aids and deliberate extremes are left out: the map exists to show
     where the real candidates part company, and something that removes half the
     band would light it end to end and say nothing */
  const others = variants
    .map((_, i) => i)
    .filter((i) => i !== pick && buffers[i] && !variants[i].aid);
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
  el('why').textContent = whyLine();
  const dur = scoreFor(shown(), variants[i]).score.duration;
  ui.rescale(dur);
  if (buffers[i]) {
    /* the whole point of the page: same moment, other version */
    if (Player.isLive(ui)) Player.swap(buffers[i]);
    else ui.setHead(Math.min(ui.pending, dur), dur);
    /* the map is drawn against whichever version is armed, so it is redrawn —
       but the head stays where it is, mid-comparison */
    drawDiff();
  } else {
    el('ready').textContent = 'ещё не готово…';
    prepare();
  }
}

/* ------------------------------------------------------------ bare mode
 *
 * One layer at a time, because I cannot hear any of it.
 *
 * Every round so far has judged a whole character — class and race and
 * alignment and five tags at once — and then argued about which of them was
 * responsible. The measurements can say a field moved the notes; they cannot
 * say a field was *heard*, and that is the only question worth asking. So the
 * bench can now switch a layer off and leave the rest standing.
 *
 * Switching a layer off means neutralising it, not deleting it: there is no
 * such thing as a character with no class, so the plainest one stands in.
 * A theme with nothing to play would answer no question at all.
 *
 *   теги          traits and looks emptied
 *   мировоззрение → true neutral, the one alignment that bends no degree
 *   раса          → human, the one with no colour instrument of its own
 *   класс         → fighter, the plainest motif family there is
 *   подкласс      subclass and second class removed
 *
 * To hear what a class sounds like on its own, switch off everything else.
 * To hear a race, switch off everything including the class.
 */
const NEUTRAL = { alignment: 'TN', race: 'human', cls: 'fighter' };

const strip = { tags: false, alignment: false, race: false, cls: false, sub: false };

function shown() {
  const c = { ...ch };
  if (strip.tags) { c.traits = []; c.looks = []; }
  if (strip.alignment) c.alignment = NEUTRAL.alignment;
  if (strip.race) c.race = NEUTRAL.race;
  if (strip.cls) { c.cls = NEUTRAL.cls; c.sub = null; c.second = undefined; }
  if (strip.sub) { c.sub = null; c.second = undefined; }
  return c;
}

/* --------------------------------------------------------------- character */

function load(next) {
  Player.stop();
  if (next) ch = next;
  generation += 1;
  buffers = [];
  el('sheet').textContent = sheetLine();
  el('why').textContent = whyLine();
  const dur = scoreFor(shown(), variants[pick]).score.duration;
  ui.rescale(dur);
  ui.setHead(0, dur);
  el('diffmap').innerHTML = '';
  el('diffnote').textContent = '';
  prepare();
}

/* ------------------------------------------------------------------ wiring */

/* the list is read in Russian too — an English name in the picker is the one
   place a wrong choice costs a whole listening round */
el('who').innerHTML = window.PRESETS
  .map((c, i) => {
    const over = ((Sheet.dict() || {}).presets || {})[c.name];
    const name = (over && over.name) || c.name;
    const cls = Sheet.label('classes', c.cls, window.Mapping.CLASSES[c.cls].label);
    return `<option value="${i}"${i === opensWith ? ' selected' : ''}>${name} — ${cls}</option>`;
  })
  .join('');
el('who').addEventListener('change', (e) => load(window.PRESETS[Number(e.target.value)]));

/* Switching a layer off re-renders every version: the character being played is
   a different one, and a buffer made from the old one would be a stale answer
   to a question that has changed. */
el('strip').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const layer = b.dataset.layer;
  strip[layer] = !strip[layer];
  b.setAttribute('aria-pressed', String(strip[layer]));
  buffers = [];
  load(null);
});

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
