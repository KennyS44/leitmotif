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
  live.button.textContent = T('play');
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
  button.textContent = T('stop');
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

async function renderOffline(ch) {
  const p = characterToParams(ch);
  const score = composeScore(p);
  const rate = 44100;
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(2, Math.ceil(rate * score.duration), rate);
  renderScore(ctx, score, p, 0);
  const buffer = await ctx.startRendering();
  return levelled(buffer);
}

/* Every theme leaves at the same height. A quiet character should sound quiet
   in its own shape — soft attacks, a thinner band — not by arriving at a lower
   volume than the file before it, which just reads as a worse recording. */
function levelled(buffer) {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 1) {
      const v = Math.abs(d[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak < 0.0001) return buffer;
  const gain = Math.min(4, 0.89 / peak);
  if (Math.abs(gain - 1) < 0.02) return buffer;
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 1) d[i] *= gain;
  }
  return buffer;
}

/* The encoder is 156 KB, so it is fetched the first time somebody actually asks
   for a file rather than on every page load. It is a separate, unmodified file
   under its own licence — see vendor/lamejs-LICENSE.txt. */
let encoderLoading = null;
function loadEncoder() {
  if (window.lamejs) return Promise.resolve();
  if (!encoderLoading) {
    encoderLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/lame.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('encoder failed to load'));
      document.head.appendChild(s);
    });
  }
  return encoderLoading;
}

function encodeMp3(buffer) {
  const rate = buffer.sampleRate;
  const enc = new window.lamejs.Mp3Encoder(2, rate, 192);
  const toPcm = (f32) => {
    const out = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i += 1) {
      const v = Math.max(-1, Math.min(1, f32[i]));
      out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    return out;
  };
  const left = toPcm(buffer.getChannelData(0));
  const right = toPcm(buffer.getChannelData(buffer.numberOfChannels > 1 ? 1 : 0));
  const chunks = [];
  const block = 1152;
  for (let i = 0; i < left.length; i += block) {
    const part = enc.encodeBuffer(left.subarray(i, i + block), right.subarray(i, i + block));
    if (part.length) chunks.push(new Uint8Array(part));
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(new Uint8Array(tail));
  return new Blob(chunks, { type: 'audio/mpeg' });
}

async function download(ch, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = T('rendering');
  try {
    await loadEncoder();
    const blob = encodeMp3(await renderOffline(ch));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ch.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.mp3`;
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
  organ: 'organ', whistle: 'low whistle', glass: 'glass', pulse: 'pulse synth',
};

const EN = {
  ui: {
    kicker: 'Prototype · step 1 of the project',
    lede: 'Twelve D&amp;D characters, twelve themes, generated in your browser from nothing but the character sheet. No interface yet, no accounts, no polish — this page exists to answer one question: <strong>can you hear the difference?</strong>',
    note: 'Play them one after another. Each theme runs about 40 seconds and is the same every time you press play. The button below rolls a character nobody chose — that one shows what the rules actually do, rather than what I decided to show.',
    play: 'Play theme',
    stop: 'Stop',
    save: 'Download MP3',
    roll: 'Roll a stranger',
    rendering: 'Rendering…',
    footTitle: 'What is actually happening',
    foot: [
      'A theme is built from two things. The <strong>class</strong> supplies a <strong>motif</strong> — a handful of intervals that is stated, answered and brought back rather than re-invented every bar. The <strong>race</strong> supplies the <strong>metre and the bar of rhythm</strong>, drawn under each card above: how many beats there are, how they are subdivided, and whether the off-beats are pushed late. The melody, the bass and the drums all take their onsets from that one grid, so they sound like one band.',
      '<strong>Alignment</strong> picks the mode — and, more importantly, the one degree that mode bends. A theme that never sounds its mode’s <strong>colour note</strong> is in that mode on paper only, so every theme lands on it once a phrase. Plain major bends nothing, which is why it gets a suspended chord and a pedal bass instead of a colour.',
      'A <strong>second class</strong> answers the motif in another voice, speaking in the melody’s silences rather than beside it, and the race brings <strong>an instrument of its own</strong> — a harp for elves, an organ for dwarves — that arrives partway through and leaves again.',
      'Nobody plays all the way through. Open an arranged song in a sequencer and most of the grid is empty: parts enter and leave at section boundaries. So the four phrases are staged — melody and bass alone, then chords, then everything leaning into the third phrase, then the full return.',
      '<strong>Traits</strong> thin or fill the rhythm and widen or narrow the motif’s reach, and <strong>looks</strong> set the register, the timbre and the size of the room. The parts are stacked in a fixed order — bass, chords, second voice, melody — and the whole stack moves together, so a low character lowers the entire band instead of burying its own tune.',
    ],
  },
  why: {
    over: 'over', answering: 'answering', arriving: 'arriving partway',
    pedal: 'mode on a pedal', leaning: 'mode, leaning on its',
    beats: 'beats', at: 'at', bpm: 'bpm', swung: 'swung', beat: 'beat',
    strain: 'class and race pulling apart', drone: 'an open drone beneath',
    rough: 'a rough edge on the tone',
    unresolved: 'unresolved harmony', bigRoom: 'a large room',
    dryRoom: 'a dry, close room',
  },
  colours: ['', 'flat second', 'flat third', 'sharp fourth',
            'flat fifth', 'natural sixth', 'flat seventh'],
};

/* Language is remembered, because nobody wants to pick it on every visit. */
let lang = localStorage.getItem('leitmotif.lang') || 'en';
const dict = () => (lang === 'ru' ? window.I18N.ru : EN);

const T = (key) => (dict().ui && dict().ui[key]) || EN.ui[key] || key;
const W = (key) => (dict().why && dict().why[key]) || EN.why[key] || key;

/* Labels live in mapping.js in English; the dictionary only overrides them. */
function label(kind, key, fallback) {
  const table = dict()[kind];
  return (table && table[key]) || fallback || key;
}

/* English gets away with one plural; Russian needs three forms chosen by the
   last digit of the number. Languages without the forms just get the default. */
function plural(n, key, fallback) {
  const forms = dict().why && dict().why[key];
  if (!forms) return fallback;
  const last = n % 10;
  const tens = n % 100;
  if (last === 1 && tens !== 11) return forms[0];
  if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) return forms[1];
  return forms[2];
}

const voiceName = (v) => label('voices', v, VOICE_NAMES[v] || v);
const modeName = (m) => label('modes', m, m);
const colourName = (i) => (dict().colours || EN.colours)[i] || EN.colours[i];

function preset(ch) {
  const over = (dict().presets || {})[ch.name];
  return { name: (over && over.name) || ch.name, blurb: (over && over.blurb) || ch.blurb };
}

/* The race's bar of rhythm, drawn: a filled circle is an accent, a hollow one
   an ordinary note. Everything in the theme lands on these. */
function rhythmGlyphs(p) {
  return window.Music.buildCell(p)
    .map((v) => (v === 2 ? '●' : (v === 1 ? '○' : '·')))
    .join('');
}

function why(p) {
  const bits = [
    `<b>${voiceName(p.lead)}</b> ${W('over')} ${voiceName(p.pad)}`,
    p.counter ? `<b>${voiceName(p.counter)}</b> ${W('answering')}` : null,
    p.hue ? `<b>${voiceName(p.hue)}</b> ${W('arriving')}` : null,
    p.colour === null
      ? `<b>${modeName(p.modeName)}</b> ${W('pedal')}`
      : `<b>${modeName(p.modeName)}</b> ${W('leaning')} <b>${colourName(p.colour)}</b>`,
    `<b>${p.beats}</b> ${plural(p.beats, 'beatForms', W('beats'))} ${W('at')} <b>${p.tempo}</b> ${W('bpm')}`
      + `${p.swing ? `, ${W('swung')}` : ''}`,
    `${W('beat')} <b class="beat">${rhythmGlyphs(p)}</b>`,
    p.strain > 0.45 ? W('strain') : null,
    p.drone ? W('drone') : null,
    p.rough > 0.25 ? W('rough') : null,
    p.tension > 0.45 ? W('unresolved') : null,
    p.rev > 0.45 ? W('bigRoom') : (p.rev < 0.2 ? W('dryRoom') : null),
  ].filter(Boolean);
  return bits.join(' · ');
}

function tagList(ch) {
  const items = [];
  (ch.traits || []).forEach((t) => TRAITS[t] && items.push(label('traits', t, TRAITS[t].label)));
  (ch.looks || []).forEach((t) => LOOKS[t] && items.push(label('looks', t, LOOKS[t].label)));
  return items.map((t) => `<li>${t}</li>`).join('');
}

function sheetLine(ch, p) {
  const one = (k) => label('classes', k, CLASSES[k].label);
  const cls = one(ch.cls) + (ch.second ? ` / ${one(ch.second)}` : '');
  const oath = p.subLabel ? `, ${label('subclasses', ch.sub, p.subLabel)}` : '';
  return `${label('races', ch.race, RACES[ch.race].label)} ${cls}${oath}`
    + ` · ${label('alignments', ch.alignment, ALIGNMENTS[ch.alignment].label)}`;
}

function cardFor(ch) {
  const p = characterToParams(ch);
  const shown = preset(ch);
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <h2 class="card__name">${shown.name}</h2>
    <p class="card__sheet">${sheetLine(ch, p)}</p>
    ${shown.blurb ? `<p class="card__blurb">${shown.blurb}</p>` : ''}
    <ul class="tags">${tagList(ch)}</ul>
    <div class="card__actions">
      <button class="btn--play" type="button">${T('play')}</button>
      <button class="btn--save" type="button">${T('save')}</button>
    </div>
    <div class="bar"><span class="bar__fill"></span></div>
    <p class="card__why">${why(p)}</p>
  `;
  const playBtn = card.querySelector('.btn--play');
  playBtn.addEventListener('click', () => play(ch, card, playBtn));
  card.querySelector('.btn--save')
    .addEventListener('click', (e) => download(ch, e.currentTarget));
  return card;
}

function build() {
  stop();
  const list = document.getElementById('list');
  list.innerHTML = '';
  window.PRESETS.forEach((ch) => list.appendChild(cardFor(ch)));

  document.getElementById('roll').textContent = T('roll');
  document.documentElement.lang = lang;
  document.getElementById('kicker').innerHTML = T('kicker');
  document.getElementById('lede').innerHTML = T('lede');
  document.getElementById('note').innerHTML = T('note');
  document.getElementById('foot-title').textContent = T('footTitle');
  const foot = dict().ui && dict().ui.foot;
  if (foot) {
    document.getElementById('foot-body').innerHTML =
      foot.map((para) => `<p>${para}</p>`).join('');
  }
  [...document.querySelectorAll('.lang button')].forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
}

/* A rolled stranger goes to the top of the list, so what the rules do to a
   character nobody chose is the first thing on the page. */
document.getElementById('roll').addEventListener('click', () => {
  const list = document.getElementById('list');
  const card = cardFor(window.rollCharacter());
  card.classList.add('card--rolled');
  list.insertBefore(card, list.firstChild);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  card.querySelector('.btn--play').focus();
});

document.querySelector('.lang').addEventListener('click', (e) => {
  const pick = e.target.closest('button');
  if (!pick || pick.dataset.lang === lang) return;
  lang = pick.dataset.lang;
  localStorage.setItem('leitmotif.lang', lang);
  build();
});

build();
window.addEventListener('pagehide', stop);

/* handles for the test harness */
window.Leitmotif = { characterToParams, composeScore, renderOffline, stop };

}());
