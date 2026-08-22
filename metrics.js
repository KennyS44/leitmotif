'use strict';

/* Your complaints, as numbers.
 *
 * The loop that costs the most is this one: you listen, you say what is wrong,
 * I guess which line of code that is, you listen again. I cannot hear the
 * result, so the guess is never checked until it reaches you.
 *
 * Each measure below is one recurring complaint, turned into something that can
 * be computed without ears. None of them says "this sounds good" — no number
 * does. What they say is "this is still what you objected to", which is enough
 * to stop me bringing you a fix that did not fix anything.
 *
 * They are deliberately crude. A crude number that moves in the right direction
 * across rounds is worth more here than an exact one that needs a library.
 *
 * Loaded by the test harness only; the page never sees this file.
 */

(function metrics() {

const MATCH = 0.004;                 /* two onsets this close are one event */
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) * (v - m))));
};
const round = (v, n) => +v.toFixed(n);

/* «несколько разных мелодий»
 *
 * The first version of this measure counted any note that did not strike with
 * the melody, and it was wrong: it failed the second class for answering in the
 * melody's gaps, which is the very thing that fuses two voices into a call and
 * a response. Alternating is not rivalry. Two parts are heard as two tunes when
 * they sound *at the same time* and *move independently*:
 *
 *   rivalry — notes that overlap a melody note without sharing its onset.
 *             Struck together, the ear welds them; answering in a gap, the ear
 *             hears one line taking turns; overlapping out of step, two lines.
 *
 *   moving  — a part that changes note rarely cannot be a tune however long it
 *             sounds. A held chord under a melody is a floor, not a rival, so
 *             rivalry is scaled by how much this part moves next to the melody.
 *
 *   timbre  — after simultaneity, the strongest thing the ear splits streams by
 *             is instrument. A part in the melody's own instrument is heard as
 *             the melody thickening; the same notes on a different instrument
 *             are heard as somebody else. Not abolished, only reduced — two
 *             violins can still be heard as two lines — so a shared timbre
 *             counts for a fraction rather than for nothing.
 *
 * 0 means the part belongs to the tune. 1 means it is a second tune. */
const SAME_VOICE = 0.4;

function apart(score, p) {
  const lead = score.tracks.lead.filter((n) => !n.grace);
  if (!lead.length) return { counter: 0, hue: 0, pad: 0, worst: 0 };
  const onsets = lead.map((n) => n.t);
  const withLead = (t) => onsets.some((x) => Math.abs(x - t) < MATCH);
  const overlaps = (n) => lead.some((m) =>
    Math.min(m.t + m.dur, n.t + n.dur) - Math.max(m.t, n.t) > 0.02);
  const bars = Math.max(1, score.endAt / score.barDur);
  const leadRate = lead.length / bars;

  const out = {};
  ['counter', 'hue', 'pad'].forEach((k) => {
    const tr = score.tracks[k];
    if (!tr.length || !leadRate) { out[k] = 0; return; }
    const rivalry = tr.filter((n) => !withLead(n.t) && overlaps(n)).length / tr.length;
    const moving = Math.min(1, (tr.length / bars) / leadRate);
    const voice = p && (p[k] || p.lead);
    /* without the parameters the timbre is unknown, and the conservative guess
       is that it differs — an unmeasured cue is not a cue in our favour */
    const timbre = p && voice === p.lead ? SAME_VOICE : 1;
    out[k] = round(rivalry * moving * timbre, 2);
  });
  out.worst = round(Math.max(out.counter, out.hue, out.pad), 2);
  return out;
}

/* «механическая составляющая»
 *
 * Machine-like is not "regular" — a march is regular and sounds alive. It is
 * everything arriving at one spacing and one weight. Two numbers, because the
 * cures are different: even spacing is fixed in the score, even weight in the
 * performance.
 *
 *   step — how much of the melody moves at its single most common spacing
 *   flat — how little the note weights vary
 *
 * Both near 1 is the complaint. */
function mechanical(score) {
  const notes = score.tracks.lead.filter((n) => !n.grace).sort((a, b) => a.t - b.t);
  const gaps = notes.slice(1).map((n, i) => round(n.t - notes[i].t, 3));
  const seen = {};
  gaps.forEach((g) => { seen[g] = (seen[g] || 0) + 1; });
  const top = Math.max(0, ...Object.values(seen));
  const vel = notes.map((n) => n.vel);
  const spread = mean(vel) ? std(vel) / mean(vel) : 0;
  return {
    step: gaps.length ? round(top / gaps.length, 2) : 1,
    flat: round(Math.max(0, 1 - spread * 5), 2),
    score: round((gaps.length ? top / gaps.length : 1)
      * Math.max(0, 1 - spread * 5), 2),
  };
}

/* «рваная линия»
 *
 * A melody with holes punched through it. Measured as the share of its own span
 * that has no melody sounding in it — silence between phrases is meant to be
 * there, so only gaps inside a phrase are counted. */
function torn(score) {
  const notes = score.tracks.lead.filter((n) => !n.grace).sort((a, b) => a.t - b.t);
  if (notes.length < 2) return { hole: 1, worst: 0 };
  const phrase = score.barsPerPhrase * score.barDur;
  let silent = 0;
  let worst = 0;
  notes.slice(1).forEach((n, i) => {
    const prev = notes[i];
    /* a phrase boundary between the two notes: the rest belongs there */
    if (Math.floor(prev.t / phrase) !== Math.floor(n.t / phrase)) return;
    const gap = n.t - (prev.t + prev.dur);
    if (gap > 0.02) { silent += gap; worst = Math.max(worst, gap); }
  });
  const span = notes[notes.length - 1].t - notes[0].t;
  return { hole: round(span ? silent / span : 0, 2), worst: round(worst, 2) };
}

/* «мусор», «колебания», «металлическая волна»
 *
 * Audio, not score: something in the sound itself pulsing at a rate too fast to
 * be the rhythm and too slow to be a pitch — the range where the ear stops
 * hearing a beat and starts hearing roughness, about 4 to 14 times a second.
 *
 * Measured without a Fourier transform: the loudness envelope, minus a smoothed
 * copy of itself, is what is left fluctuating in that band. Crude, but it is
 * the same crude number every round, so it can be compared with the last one. */
function wobble(buffer) {
  const d = buffer.getChannelData(0);
  const rate = buffer.sampleRate;
  const hop = Math.round(rate / 100);           /* 100 envelope points a second */
  const env = [];
  for (let i = 0; i + hop <= d.length; i += hop) {
    let s = 0;
    for (let j = i; j < i + hop; j += 1) s += d[j] * d[j];
    env.push(Math.sqrt(s / hop));
  }
  /* everything slower than ~4 Hz is the music; take it away */
  const smooth = (a, w) => a.map((_, i) => {
    const from = Math.max(0, i - w);
    const to = Math.min(a.length, i + w + 1);
    return mean(a.slice(from, to));
  });
  const slow = smooth(env, 12);                 /* ~0.25s window */
  const fast = smooth(env, 2);                  /* ~0.05s window, kills hiss */
  const band = fast.map((v, i) => v - slow[i]);
  const level = mean(env);
  return level ? round(std(band) / level, 3) : 0;
}

/* «менее чисто», «мутно»
 *
 * Energy between roughly 200 and 500 Hz, as a share of the whole. That band is
 * where instruments pile up without being heard as instruments: too low to
 * carry a tune, too high to be the bottom, and crowded by the lower harmonics
 * of everything on top of it. Fill it and the result is not louder, it is less
 * clear.
 *
 * Measured after the pad was found to add about a decibel there and nothing
 * anywhere else — the whole of its audible contribution was a veil. A number
 * here means the next attempt at a background can be checked before it is
 * played to anybody.
 *
 * A second-order bandpass, written out rather than taken from an audio graph,
 * so it can be run on a plain array with no context and no rendering. */
function bandpass(d, rate, f0, q) {
  const w = (2 * Math.PI * f0) / rate;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
  let sum = 0;
  for (let i = 0; i < d.length; i += 1) {
    const x = d[i];
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    sum += y * y;
  }
  return Math.sqrt(sum / d.length);
}

function mud(buffer) {
  const d = buffer.getChannelData(0);
  let total = 0;
  for (let i = 0; i < d.length; i += 1) total += d[i] * d[i];
  total = Math.sqrt(total / d.length);
  if (total < 1e-6) return 0;
  /* centred at 316 Hz — the geometric middle of 200 and 500 — wide enough to
     cover the band and no wider */
  return round(bandpass(d, buffer.sampleRate, 316, 0.8) / total, 3);
}

/* Everything at once. `p` supplies the instruments, `buffer` the samples —
   without the buffer the audio measure is left out, which is what the fast
   level of the checks does. */
function report(score, p, buffer) {
  const a = apart(score, p);
  const m = mechanical(score);
  const t = torn(score);
  const out = {
    twoTunes: a.worst,
    apartCounter: a.counter,
    apartHue: a.hue,
    apartPad: a.pad,
    step: m.step,
    flat: m.flat,
    machine: m.score,
    hole: t.hole,
    longestHole: t.worst,
  };
  if (buffer) {
    out.wobble = wobble(buffer);
    out.mud = mud(buffer);
  }
  return out;
}

window.Metrics = { apart, mechanical, torn, wobble, mud, report };

}());
