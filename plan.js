'use strict';

/* What every class actually plays, drawn rather than described.
 *
 * Kenny's complaint was that almost everything shares one background figure and
 * one instrument. Answering that with prose would have been an argument; drawn
 * from the real score it is a fact, and the picture makes the cause obvious in
 * a second: every background lane is the same row of blocks on the bar lines,
 * whatever the genre says.
 *
 * The diagrams are generated from `composeScore`, not stored, so they cannot
 * drift from what the site plays. Change the mapping and the pictures change.
 */

(function plan() {

const Sheet = window.Sheet;
Sheet.use('ru');

const { scoreFor } = window.Render;
const variants = window.VARIANTS.list;

/* one lane per part, in the order they sit in the mix */
const LANES = [
  { key: 'lead',    title: 'мелодия',       colour: '#d9a441' },
  { key: 'counter', title: 'второй голос',  colour: '#c98b6a' },
  { key: 'hue',     title: 'цвет',          colour: '#8fae7e' },
  { key: 'pad',     title: 'фон',           colour: '#6f8bb0' },
  { key: 'bass',    title: 'бас',           colour: '#7a6f9e' },
  { key: 'perc',    title: 'ударные',       colour: '#8a8378' },
];

const W = 880;
const LANE_H = 46;
const GAP = 6;
const LEFT = 104;
const TOP = 26;

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function voiceName(p, key) {
  const v = { lead: p.lead, counter: p.counter, hue: p.hue, pad: p.pad, bass: null, perc: p.perc }[key];
  if (key === 'bass') return '';
  if (!v) return '—';
  return Sheet.label(key === 'perc' ? 'kits' : 'voices', v, v);
}

/* The melody lane is a piano roll — the shape of the tune is the thing being
   asked about. Every other lane only has to answer "playing or not", so it is
   drawn flat: a lane of blocks reads as a pattern, and a pattern is what is
   being compared across classes. */
function laneSvg(lane, notes, y, dur, range) {
  if (!notes.length) {
    return `<text x="${LEFT + 8}" y="${y + LANE_H / 2 + 5}" class="d-empty">не играет</text>`;
  }
  const x = (t) => LEFT + (t / dur) * (W - LEFT - 12);
  const isMelody = lane.key === 'lead' || lane.key === 'counter';
  return notes.map((n) => {
    /* a drum hit carries no length — it is an instant, and drawn as one */
    const len = Number.isFinite(n.dur) ? Math.min(n.dur, dur) : 0;
    const w = Math.max(2, x(n.t + len) - x(n.t));
    if (!isMelody) {
      const h = lane.key === 'perc' ? 8 + (n.vel || 0.5) * 12 : LANE_H - 16;
      return `<rect x="${x(n.t).toFixed(1)}" y="${(y + (LANE_H - h) / 2).toFixed(1)}"`
        + ` width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2"`
        + ` fill="${lane.colour}" opacity="${(0.35 + (n.vel || 0.5) * 0.5).toFixed(2)}"/>`;
    }
    const span = Math.max(1, range.hi - range.lo);
    const rel = (n.midi - range.lo) / span;
    const ny = y + LANE_H - 10 - rel * (LANE_H - 18);
    return `<rect x="${x(n.t).toFixed(1)}" y="${ny.toFixed(1)}"`
      + ` width="${w.toFixed(1)}" height="5" rx="2.5"`
      + ` fill="${lane.colour}" opacity="${(0.45 + (n.vel || 0.5) * 0.5).toFixed(2)}"/>`;
  }).join('');
}

function diagram(ch, variant) {
  const { p, score } = scoreFor(ch, variant);
  const dur = score.duration;
  const H = TOP + LANES.length * (LANE_H + GAP) + 22;
  const x = (t) => LEFT + (t / dur) * (W - LEFT - 12);

  const melody = score.tracks.lead.concat(score.tracks.counter || []);
  const range = melody.length
    ? { lo: Math.min(...melody.map((n) => n.midi)), hi: Math.max(...melody.map((n) => n.midi)) }
    : { lo: 60, hi: 72 };

  /* the four phrases: A A' B A'' */
  const phrase = score.barsPerPhrase * score.barDur;
  const marks = [0, 1, 2, 3].map((i) => {
    const px = x(i * phrase);
    return `<line x1="${px.toFixed(1)}" y1="${TOP - 8}" x2="${px.toFixed(1)}" y2="${H - 20}"`
      + ` stroke="var(--line)" stroke-width="1"/>`
      + `<text x="${(px + 5).toFixed(1)}" y="${TOP - 12}" class="d-phrase">`
      + `${['A', "A'", 'B', "A''"][i]}</text>`;
  }).join('');

  const lanes = LANES.map((lane, i) => {
    const y = TOP + i * (LANE_H + GAP);
    const notes = score.tracks[lane.key] || [];
    const name = voiceName(p, lane.key);
    return `<rect x="${LEFT}" y="${y}" width="${W - LEFT - 12}" height="${LANE_H}"`
      + ` fill="var(--panel)" rx="4"/>`
      + `<text x="0" y="${y + 19}" class="d-lane">${esc(lane.title)}</text>`
      + `<text x="0" y="${y + 35}" class="d-voice">${esc(name)}</text>`
      + laneSvg(lane, notes, y, dur, range);
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
      aria-label="Схема аранжировки: ${esc(Sheet.label('classes', ch.cls, ch.cls))}">
    ${marks}${lanes}
    <text x="${LEFT}" y="${H - 4}" class="d-time">0:00</text>
    <text x="${W - 12}" y="${H - 4}" class="d-time" text-anchor="end">${
      Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')}</text>
  </svg>`;
}

function head(ch, variant) {
  const { p } = scoreFor(ch, variant);
  const cls = Sheet.label('classes', ch.cls, window.Mapping.CLASSES[ch.cls].label);
  const over = ((Sheet.dict() || {}).presets || {})[ch.name];
  const genre = variant.genreOf ? variant.genreOf(ch) : null;
  return `<h2 class="d-title">${esc(cls)}${genre ? ` · <span class="d-genre">${esc(genre)}</span>` : ''}</h2>
    <p class="d-sheet">${esc((over && over.name) || ch.name)} · ${
      Sheet.label('modes', p.modeName, p.modeName)} лад · ${
      Math.round(p.tempo)} уд/мин${p.swing ? `, со сдвигом ${p.swing}` : ''}</p>`;
}

/* one card per class, in the order the classes are listed in Russian */
function draw() {
  const variant = variants[Number(el('which').value)];
  const seen = new Set();
  const cards = window.PRESETS
    .filter((c) => (seen.has(c.cls) ? false : seen.add(c.cls)))
    .map((ch) => ({ ch, name: Sheet.label('classes', ch.cls, ch.cls) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    .map(({ ch }) => `<article class="card d-card">${head(ch, variant)}${diagram(ch, variant)}</article>`)
    .join('');
  el('plans').innerHTML = cards;
}

el('which').innerHTML = variants
  .map((v, i) => `<option value="${i}"${i === 1 ? ' selected' : ''}>${esc(v.label)}</option>`)
  .join('');
el('which').addEventListener('change', draw);
draw();

}());
