'use strict';

/* One thing sounds at a time, anywhere on the site, and whatever sounds can be
   moved through.
 *
 * The theme is rendered to a buffer first and played from that, rather than
 * scheduled note by note into a live context. That costs a moment before the
 * first play and buys the two things a listener needs in order to report a
 * fault: the whole length is known before it starts, and any moment in it can
 * be reached again. "The flute tears at 0:22" is worth more than "the flute is
 * ragged" — the first names a bar, and a bar names a line of code.
 *
 * One shared context, because a browser allows only a handful of them and a
 * page of twelve cards would run out. */

(function player() {

let audio = null;
function context() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

let live = null;   /* { ui, buffer, source, base, at, raf, dragging } */

/* where the head is, in seconds */
function position() {
  if (!live) return 0;
  if (live.source) return Math.min(live.buffer.duration, context().currentTime - live.base);
  return live.at;
}

function silence() {
  if (!live || !live.source) return;
  live.source.cancelled = true;
  try { live.source.stop(); } catch (e) { /* already finished */ }
  live.source.disconnect();
  live.source = null;
}

function stop() {
  if (!live) return;
  cancelAnimationFrame(live.raf);
  silence();
  const ui = live.ui;
  live = null;
  ui.state(false);
}

/* Playing is always "from here": pressing play, dropping the head somewhere,
   switching to another version and reaching the end all go through this door. */
function from(at) {
  const ctx = context();
  silence();
  const start = Math.max(0, Math.min(live.buffer.duration - 0.01, at));
  const src = ctx.createBufferSource();
  src.buffer = live.buffer;
  src.connect(ctx.destination);
  src.onended = () => { if (!src.cancelled && live && live.source === src) ended(); };
  src.start(0, start);
  live.source = src;
  live.base = ctx.currentTime - start;
  live.at = start;
}

/* The end leaves the head at the end rather than snapping it back, so the last
   seconds can be heard again with one drag instead of a scrub from zero. */
function ended() {
  const ui = live.ui;
  const total = live.buffer.duration;
  stop();
  ui.setHead(total, total);
}

function tick() {
  if (!live) return;
  if (!live.dragging) live.ui.setHead(position(), live.buffer.duration);
  live.raf = requestAnimationFrame(tick);
}

function start(buffer, ui, at) {
  stop();
  live = { ui, buffer, source: null, base: 0, at: 0, raf: 0, dragging: false };
  ui.state(true);
  from(at > 0 && at < buffer.duration - 0.05 ? at : 0);
  live.raf = requestAnimationFrame(tick);
}

/* The comparison page's whole point: the other version of the same theme, from
   the same moment, without a gap to forget the first one across. */
function swap(buffer) {
  if (!live) return;
  const at = position();
  live.buffer = buffer;
  from(at);
}

const isLive = (ui) => !!live && live.ui === ui;
const busy = () => !!live;

function seek(ui, at) {
  if (isLive(ui)) from(at);
}

/* -------------------------------------------------------------- the strip */

function clockText(sec) {
  const whole = Math.max(0, Math.round(sec));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function strip(label) {
  return `
    <div class="transport">
      <input class="seek" type="range" min="0" max="100" step="1" value="0"
             aria-label="${label}">
      <p class="time"><span class="time__now">0:00</span> / <span class="time__total">0:00</span></p>
    </div>`;
}

/* The bar: the full length is shown before anything is played, and the head can
   be dragged whether or not it is playing. A range input rather than a div,
   because it arrives with arrow keys, a screen-reader label and touch dragging
   already working. */
function transport(root, total, hooks) {
  const head = root.querySelector('.seek');
  const nowEl = root.querySelector('.time__now');
  const totalEl = root.querySelector('.time__total');

  head.max = String(Math.round(total * 100));
  totalEl.textContent = clockText(total);

  const ui = {
    root,
    head,
    pending: 0,
    state: hooks.state || (() => {}),
    setHead(at, dur) {
      head.value = String(Math.round(at * 100));
      head.style.setProperty('--played', `${(at / dur) * 100}%`);
      nowEl.textContent = clockText(at);
      ui.pending = at;
    },
    /* a swapped-in version may be a hair longer or shorter than the one it
       replaces, so the scale is re-hung rather than assumed */
    rescale(dur) {
      head.max = String(Math.round(dur * 100));
      totalEl.textContent = clockText(dur);
    },
  };
  ui.setHead(0, total);

  /* dragging moves the readout continuously; the sound only jumps when the head
     is let go, because restarting the buffer sixty times a second stutters */
  head.addEventListener('input', () => {
    if (isLive(ui)) live.dragging = true;
    ui.setHead(Number(head.value) / 100, Number(head.max) / 100);
  });
  head.addEventListener('change', () => {
    const at = Number(head.value) / 100;
    ui.pending = at;
    if (isLive(ui)) { live.dragging = false; from(at); }
    else if (hooks.onSeek) hooks.onSeek(at);
  });
  return ui;
}

window.Player = { start, stop, swap, seek, isLive, busy, position,
                  transport, strip, clockText };

window.addEventListener('pagehide', stop);

}());
