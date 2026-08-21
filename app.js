'use strict';

/* The page: six cards, one playing at a time, and a WAV export so a theme can
   leave the browser. Deliberately thin — the prototype is about the sound.
 *
 * Wrapped, because plain <script> files share one scope and mapping.js already
 * owns the name `characterToParams`.
 */

(function page() {

const { characterToParams, CLASSES, RACES, ALIGNMENTS, TRAITS, LOOKS } = window.Mapping;
const { composeScore, renderScore } = window.Music;

let live = null;        /* { ctx, card, fill, raf, ends } */

function stop() {
  if (!live) return;
  cancelAnimationFrame(live.raf);
  live.card.classList.remove('is-playing');
  live.button.textContent = 'Play theme';
  const dying = live.ctx;
  live = null;
  /* closing the context is the one way to silence notes that were already
     scheduled ahead of time */
  dying.close().catch(() => {});
}

function play(ch, card, button) {
  const wasSame = live && live.id === ch.name;
  stop();
  if (wasSame) return;

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const p = characterToParams(ch);
  const score = composeScore(p);
  const endsAt = renderScore(ctx, score, p);

  card.classList.add('is-playing');
  button.textContent = 'Stop';
  const fill = card.querySelector('.bar__fill');
  const startedAt = ctx.currentTime;

  live = { ctx, card, button, id: ch.name, raf: 0 };
  const tick = () => {
    if (!live || live.ctx !== ctx) return;
    const done = (ctx.currentTime - startedAt) / (endsAt - startedAt);
    fill.style.width = `${Math.min(100, Math.max(0, done * 100))}%`;
    if (ctx.currentTime >= endsAt) { stop(); return; }
    live.raf = requestAnimationFrame(tick);
  };
  live.raf = requestAnimationFrame(tick);
}

/* ---------------------------------------------------------------- export */

function encodeWav(buffer) {
  const chans = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = frames * chans * 2;
  const view = new DataView(new ArrayBuffer(44 + bytes));
  const str = (off, s) => { for (let i = 0; i < s.length; i += 1) view.setUint8(off + i, s.charCodeAt(i)); };

  str(0, 'RIFF');
  view.setUint32(4, 36 + bytes, true);
  str(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, chans, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * chans * 2, true);
  view.setUint16(32, chans * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, bytes, true);

  const data = [];
  for (let c = 0; c < chans; c += 1) data.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < chans; c += 1) {
      const v = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([view.buffer], { type: 'audio/wav' });
}

async function renderOffline(ch) {
  const p = characterToParams(ch);
  const score = composeScore(p);
  const rate = 44100;
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(2, Math.ceil(rate * score.duration), rate);
  renderScore(ctx, score, p, 0);
  return ctx.startRendering();
}

async function download(ch, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Rendering…';
  try {
    const blob = encodeWav(await renderOffline(ch));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ch.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

/* ------------------------------------------------------------------- ui */

const VOICE_NAMES = {
  brass: 'brass', horn: 'low horns', strings: 'bowed strings', choir: 'choir',
  air: 'airy pad', dark: 'dark pad', lute: 'lute', pizz: 'pizzicato',
  bell: 'bells', flute: 'flute', harp: 'harp', fiddle: 'fiddle',
  organ: 'organ', whistle: 'low whistle', glass: 'glass',
};

/* The race's bar of rhythm, drawn: a filled circle is an accent, a hollow one
   an ordinary note. Everything in the theme lands on these. */
function rhythmGlyphs(p) {
  return window.Music.buildCell(p)
    .map((v) => (v === 2 ? '●' : (v === 1 ? '○' : '·')))
    .join('');
}

const COLOUR_NAMES = ['', 'flat second', 'flat third', 'sharp fourth',
                      'flat fifth', 'natural sixth', 'flat seventh'];

function why(p) {
  const bits = [
    `<b>${VOICE_NAMES[p.lead] || p.lead}</b> over ${VOICE_NAMES[p.pad] || p.pad}`,
    p.counter ? `with <b>${VOICE_NAMES[p.counter]}</b> answering` : null,
    p.hue ? `<b>${VOICE_NAMES[p.hue]}</b> arriving partway` : null,
    p.colour === null
      ? `<b>${p.modeName}</b> mode on a pedal`
      : `<b>${p.modeName}</b> mode, leaning on its <b>${COLOUR_NAMES[p.colour]}</b>`,
    `<b>${p.beats}</b> beats at <b>${p.tempo}</b> bpm${p.swing ? ', swung' : ''}`,
    `beat <b class="beat">${rhythmGlyphs(p)}</b>`,
    p.drone ? 'an open drone beneath' : null,
    p.rough > 0.25 ? 'a rough edge on the tone' : null,
    p.tension > 0.45 ? 'unresolved harmony' : null,
    p.rev > 0.45 ? 'a large room' : (p.rev < 0.2 ? 'a dry, close room' : null),
  ].filter(Boolean);
  return bits.join(' · ');
}

function tagList(ch) {
  const items = [];
  (ch.traits || []).forEach((t) => TRAITS[t] && items.push(TRAITS[t].label));
  (ch.looks || []).forEach((t) => LOOKS[t] && items.push(LOOKS[t].label));
  return items.map((t) => `<li>${t}</li>`).join('');
}

function sheetLine(ch) {
  const cls = CLASSES[ch.cls].label + (ch.second ? ` / ${CLASSES[ch.second].label}` : '');
  return `${RACES[ch.race].label} ${cls} · ${ALIGNMENTS[ch.alignment].label}`;
}

function build() {
  const list = document.getElementById('list');
  window.PRESETS.forEach((ch) => {
    const p = characterToParams(ch);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h2 class="card__name">${ch.name}</h2>
      <p class="card__sheet">${sheetLine(ch)}</p>
      <p class="card__blurb">${ch.blurb}</p>
      <ul class="tags">${tagList(ch)}</ul>
      <div class="card__actions">
        <button class="btn--play" type="button">Play theme</button>
        <button class="btn--save" type="button">Download WAV</button>
      </div>
      <div class="bar"><span class="bar__fill"></span></div>
      <p class="card__why">${why(p)}</p>
    `;
    const playBtn = card.querySelector('.btn--play');
    playBtn.addEventListener('click', () => play(ch, card, playBtn));
    card.querySelector('.btn--save')
      .addEventListener('click', (e) => download(ch, e.currentTarget));
    list.appendChild(card);
  });
}

build();
window.addEventListener('pagehide', stop);

/* handles for the test harness */
window.Leitmotif = { characterToParams, composeScore, renderOffline, stop };

}());
