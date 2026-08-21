'use strict';

/* The generic half: a small composer and a small synthesiser.
 *
 * Neither knows anything about D&D. They are handed the parameter block that
 * mapping.js produced and they play it.
 *
 * The composer is built on two things the first version did not have, and
 * whose absence is exactly what made it sound like scattered notes:
 *
 *   a MOTIF — a fixed handful of intervals that is stated, repeated and varied
 *   instead of re-invented every bar. Music becomes recognisable through
 *   repetition; a random walk, however well-tuned its statistics, cannot be
 *   remembered because there is nothing in it that ever comes back.
 *
 *   a CELL — one bar of rhythm that everything else locks onto. The melody,
 *   the bass and the drums all take their onsets from the same grid, so they
 *   sound like one band rather than three processes running side by side.
 *
 * On top of those sits a FORM: four phrases arranged A A' B A'', so forty
 * seconds has a shape instead of just a length.
 */

/* Deterministic pseudo-random. Seeded from the character, so the same sheet
   produces the same theme on every machine. */
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PHRASES = 4;
const BARS_PER_PHRASE = 4;
const SLOTS = 8;                    /* eighth notes in a 4/4 bar */

/* A A' B A''. The B phrase lifts the same motif to a different step of the
   scale — contrast without introducing a stranger. */
const FORM = [
  { roles: ['state', 'vary', 'state', 'close'], lift: 0, chords: 'home' },
  { roles: ['state', 'vary', 'turn',  'close'], lift: 0, chords: 'home' },
  { roles: ['turn',  'vary', 'turn',  'close'], lift: 3, chords: 'away' },
  { roles: ['state', 'vary', 'state', 'close'], lift: 0, chords: 'home' },
];

/* Two progressions only, and the home one repeats in three phrases out of
   four. Harmony that keeps coming back is what lets the ear hear a return. */
const HOME_CHORDS = [
  { degrees: [0, 3, 4, 0], settled: 1.0 },
  { degrees: [0, 5, 3, 4], settled: 0.5 },
  { degrees: [0, 4, 5, 0], settled: 0.8 },
];
const AWAY_CHORDS = [5, 3, 1, 4];

function scalePitch(p, degree) {
  const n = p.mode.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return p.mode[idx] + oct * 12;
}

/* ---------------------------------------------------------------- rhythm */

/* The race brings a bar of rhythm: 2 = accent, 1 = note, 0 = rest. Traits are
   allowed to thin it or fill it in, but never to replace it — the pulse has to
   survive so that the character still walks the way its race walks. */
function buildCell(p) {
  const cell = (p.cell || [2, 0, 1, 0, 2, 0, 1, 0]).slice();
  const rand = rng(p.seed ^ 0x9e3779b9);

  let budget = Math.round(p.cellMod * 8);
  /* thinning takes the weakest notes first, filling adds off-beats: a calm
     character breathes, a restless one fidgets, and both keep the accents */
  while (budget < 0) {
    const weak = [];
    cell.forEach((v, i) => { if (v === 1) weak.push(i); });
    if (!weak.length) break;
    cell[weak[Math.floor(rand() * weak.length)]] = 0;
    budget += 1;
  }
  while (budget > 0) {
    const holes = [];
    cell.forEach((v, i) => { if (v === 0) holes.push(i); });
    if (!holes.length) break;
    /* prefer off-beats, which is what makes added notes feel like syncopation
       rather than just more of the same */
    const off = holes.filter((i) => i % 2 === 1);
    const pool = off.length && rand() < 0.5 + p.sync ? off : holes;
    cell[pool[Math.floor(rand() * pool.length)]] = 1;
    budget -= 1;
  }
  if (!cell.some((v) => v === 2)) cell[0] = 2;
  return cell;
}

const onsetsOf = (cell) => cell.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);

/* ----------------------------------------------------------------- motif */

/* Each role is a different thing to do with the same handful of intervals.
   Nothing here invents new material; that is the point.
 *
 * Deliberately free of randomness. The same role always produces the same
 * result, so that the fourth phrase can be literally the first one again —
 * a return the ear can actually catch. */
function shapeMotif(motif, role) {
  const m = motif.slice();
  switch (role) {
    case 'state':
      return m;
    case 'vary': {
      /* the tail moves, the head stays — the ear hears "the same, but".
         It moves against the motif's own direction, so a rising theme is
         answered downwards and a sinking one is answered upwards. */
      const dir = m[m.length - 1] >= m[0] ? -1 : 1;
      m[m.length - 1] += dir;
      return m;
    }
    case 'turn':
      /* rotate and lift: recognisably the motif, told from another angle */
      return m.slice(1).concat(m.slice(0, 1)).map((d) => d + 2);
    case 'close':
      /* shorten and come home */
      return m.slice(0, Math.max(2, m.length - 1)).concat([0]);
    default:
      return m;
  }
}

function nearestChordTone(p, degree, chordDeg) {
  const tones = [chordDeg, chordDeg + 2, chordDeg + 4];
  let best = degree; let bestD = 99;
  for (let oct = -1; oct <= 2; oct += 1) {
    tones.forEach((tn) => {
      const cand = tn + oct * 7;
      const d = Math.abs(cand - degree);
      if (d < bestD) { bestD = d; best = cand; }
    });
  }
  return best;
}

/* ---------------------------------------------------------------- score */

const ROLE_SALT = { state: 0x1f2e3d, vary: 0x4c5b6a, turn: 0x778899, close: 0xaabbcc };

function composeScore(p) {
  const beat = 60 / p.tempo;
  const barDur = beat * 4;
  const slotDur = barDur / SLOTS;

  const cell = buildCell(p);
  const onsets = onsetsOf(cell);
  const motif = (p.motif && p.motif.length ? p.motif : [0, 2, 4, 2]).slice();
  const branch = p.branchMotif || null;
  const spread = 0.70 + p.leap;      /* traits widen or narrow the same shape */

  const bassRoot = p.root;
  const padRoot = p.root + 12;
  const leadCentre = p.root + 24 + p.reg;

  const tracks = { lead: [], counter: [], pad: [], bass: [], perc: [] };

  /* the progression that best matches how settled this character is */
  const homePick = HOME_CHORDS.slice().sort(
    (a, b) => Math.abs(a.settled - p.cadence) - Math.abs(b.settled - p.cadence))[0];

  for (let ph = 0; ph < PHRASES; ph += 1) {
    const form = FORM[ph];
    const chords = form.chords === 'home' ? homePick.degrees : AWAY_CHORDS;
    /* only the contrast phrase moves; the A phrases all sit at the same height
       so that the last one is heard as a return and not as a third idea */
    const lift = form.lift ? form.lift + Math.round(p.rise * 3) : 0;

    for (let b = 0; b < BARS_PER_PHRASE; b += 1) {
      const bar = ph * BARS_PER_PHRASE + b;
      const t = bar * barDur;
      const role = form.roles[b];
      const chordDeg = chords[b];
      const lastBar = ph === PHRASES - 1 && b === BARS_PER_PHRASE - 1;

      /* --- harmony: one chord per bar, held ------------------------- */
      const tones = [0, 2, 4].map((s) => scalePitch(p, (lastBar ? 0 : chordDeg) + s));
      if (p.tension > 0.40) tones.push(scalePitch(p, chordDeg + 6));
      if (p.tension > 0.65) tones.push(scalePitch(p, chordDeg + 1) + 12);
      tones.forEach((semi) => {
        tracks.pad.push({ t, midi: padRoot + semi, dur: barDur * 0.98, vel: 0.30 + p.dyn * 0.12 });
      });

      /* --- bass: the accents of the cell, nothing else --------------- */
      if (p.drone && b === 0) {
        const len = barDur * BARS_PER_PHRASE * 0.99;
        tracks.bass.push({ t, midi: bassRoot, dur: len, vel: 0.38 });
        tracks.bass.push({ t, midi: bassRoot + 7, dur: len, vel: 0.28 });
      }
      const root = bassRoot + (scalePitch(p, lastBar ? 0 : chordDeg) % 12);
      cell.forEach((v, s) => {
        if (v !== 2) return;
        tracks.bass.push({
          t: t + s * slotDur, midi: s === 0 ? root : root + 7,
          dur: slotDur * 2.4, vel: 0.42 + p.dyn * 0.14,
        });
      });

      /* --- melody: the motif, laid on the cell ----------------------
         Decisions inside a bar depend on the bar's role and position, never on
         how many bars came before it. That is what lets the fourth phrase come
         back as the first one rather than as something merely similar. */
      const barRand = rng((p.seed ^ ROLE_SALT[role] ^ (b * 2654435761)) >>> 0);
      const seq = shapeMotif(motif, role);
      /* the second class takes over the answering bar once, in the second
         phrase only — leaving the first and last phrases identical, so the
         return still lands */
      const useBranch = branch && role === 'vary' && ph === 1;
      const line = useBranch ? shapeMotif(branch, 'vary') : seq;

      onsets.forEach((slot, i) => {
        let degree = lift + Math.round(line[i % line.length] * spread);
        const first = i === 0;
        const last = i === onsets.length - 1;
        /* anchor only the ends of the bar to the harmony: enough to keep the
           chord honest, not enough to erase the shape of the motif */
        if (first || (last && role === 'close')) degree = nearestChordTone(p, degree, chordDeg);
        if (lastBar && last) degree = 0;

        const next = i + 1 < onsets.length ? onsets[i + 1] : SLOTS;
        const dur = Math.max(slotDur * 0.6, (next - slot) * slotDur * p.legato);
        const accent = cell[slot] === 2;
        tracks.lead.push({
          t: t + slot * slotDur,
          midi: leadCentre + scalePitch(p, degree),
          dur,
          vel: p.dyn * (accent ? 1.0 : 0.78),
        });

        /* ornaments only decorate accents, and only sometimes — scattered
           grace notes were half of why the first version sounded loose */
        if (accent && barRand() < p.orn * 0.5 && slot > 0) {
          tracks.lead.push({
            t: t + slot * slotDur - slotDur * 0.26,
            midi: leadCentre + scalePitch(p, degree + 1),
            dur: slotDur * 0.22,
            vel: p.dyn * 0.55,
          });
        }
      });

      /* --- the second class: a short fork under the melody ---------- */
      if (branch && (role === 'turn' || (role === 'vary' && !useBranch))) {
        const fork = shapeMotif(branch, 'turn');
        onsets.filter((s) => cell[s] === 1).slice(0, fork.length).forEach((slot, i) => {
          tracks.counter.push({
            t: t + slot * slotDur,
            midi: leadCentre - 12 + scalePitch(p, lift + fork[i]),
            dur: slotDur * 1.6 * p.legato,
            vel: p.dyn * 0.5,
          });
        });
      }

      /* --- percussion: the same cell, played by the kit ------------- */
      addPerc(tracks.perc, p, t, slotDur, cell, bar);
    }
  }

  const duration = PHRASES * BARS_PER_PHRASE * barDur + 2.4;
  return { duration, barDur, cell, motif, tracks };
}

/* The kit reads the cell rather than a pattern of its own, which is what makes
   the drums sound like they are playing with the tune and not next to it. */
function addPerc(out, p, t, slotDur, cell, bar) {
  if (!p.perc) return;
  const v = 0.42 + p.dyn * 0.25;
  const push = (slot, kind, vel) => out.push({ t: t + slot * slotDur, kind, vel });

  cell.forEach((val, s) => {
    if (!val) return;
    const accent = val === 2;
    switch (p.perc) {
      case 'martial':
        push(s, accent ? 'kick' : 'snare', v * (accent ? 1.0 : 0.6));
        break;
      case 'heavy':
        push(s, accent ? 'kick' : 'tom', v * (accent ? 1.15 : 0.6));
        break;
      case 'light':
        push(s, accent ? 'kick' : 'shaker', v * (accent ? 0.7 : 0.35));
        break;
      case 'frame':
        push(s, 'frame', v * (accent ? 1.0 : 0.55));
        break;
      case 'wood':
        push(s, 'wood', v * (accent ? 0.6 : 0.35));
        break;
      default:
        break;
    }
  });

  /* an extra stroke on the last onset of every second bar, so the four-bar
     phrase has a seam you can hear — still on the grid, like everything else */
  if (bar % 2 === 1 && (p.perc === 'martial' || p.perc === 'heavy')) {
    const onsets = cell.map((v2, i) => (v2 ? i : -1)).filter((i) => i >= 0);
    push(onsets[onsets.length - 1], p.perc === 'heavy' ? 'tom' : 'snare', v * 0.5);
  }
}

/* ------------------------------------------------------------------ audio */

const noiseCache = new WeakMap();

function noiseBuffer(ctx) {
  if (noiseCache.has(ctx)) return noiseCache.get(ctx);
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (s / 0x3fffffff) - 1;
  }
  noiseCache.set(ctx, buf);
  return buf;
}

function impulse(ctx, seconds, decay) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  let s = 987654321;
  for (let c = 0; c < 2; c += 1) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i += 1) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const n = (s / 0x3fffffff) - 1;
      data[i] = n * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function env(ctx, node, t, dur, peak, attack, release) {
  const g = node.gain;
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.setValueAtTime(Math.max(0.0002, peak), t + Math.max(attack, dur));
  g.exponentialRampToValueAtTime(0.0001, t + Math.max(attack, dur) + release);
}

function detuneOsc(ctx, type, freq, cents, t, stop) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.setValueAtTime(cents, t);
  o.start(t);
  o.stop(stop);
  return o;
}

/* Each voice is a tiny patch. They are deliberately plain — the prototype is
   testing whether the mapping is audible, not whether the samples are pretty. */
function playNote(ctx, dest, voice, note, p) {
  const t = note.t;
  const f = freqOf(note.midi);
  const vel = Math.max(0.02, note.vel);
  const rough = p.rough;
  const atk = p.attack;
  const out = ctx.createGain();
  out.connect(dest);

  const simple = (cents, cutoff, attack, release, wave) => {
    const stop = t + note.dur + release + 0.1;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(cutoff * (0.6 + vel * 0.8), t);
    filt.Q.value = 0.7;
    filt.connect(out);
    cents.forEach((c) => {
      const o = detuneOsc(ctx, wave, f, c + (Math.random() - 0.5) * rough * 30, t, stop);
      o.connect(filt);
    });
    env(ctx, out, t, note.dur, vel * 0.30, attack * atk, release);
  };

  switch (voice) {
    case 'brass': {
      const stop = t + note.dur + 0.35;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.Q.value = 1.2;
      filt.frequency.setValueAtTime(420, t);
      filt.frequency.linearRampToValueAtTime(1100 + 2200 * vel, t + 0.08 * atk);
      filt.frequency.linearRampToValueAtTime(700 + 900 * vel, t + note.dur);
      filt.connect(out);
      [-7 - rough * 20, 6 + rough * 20].forEach((c) => detuneOsc(ctx, 'sawtooth', f, c, t, stop).connect(filt));
      env(ctx, out, t, note.dur, vel * 0.26, 0.05 * atk, 0.22);
      break;
    }
    case 'horn': {
      const stop = t + note.dur + 0.4;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.Q.value = 0.9;
      filt.frequency.setValueAtTime(300, t);
      filt.frequency.linearRampToValueAtTime(700 + 900 * vel, t + 0.12 * atk);
      filt.connect(out);
      [-10 - rough * 25, 9 + rough * 25].forEach((c) => detuneOsc(ctx, 'sawtooth', f, c, t, stop).connect(filt));
      detuneOsc(ctx, 'sine', f / 2, 0, t, stop).connect(filt);
      env(ctx, out, t, note.dur, vel * 0.30, 0.07 * atk, 0.28);
      break;
    }
    case 'strings':
      simple([-9, 0, 8], 2300, 0.20, 0.30, 'sawtooth');
      break;
    case 'choir': {
      const stop = t + note.dur + 0.7;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1250; filt.Q.value = 1.1;
      filt.connect(out);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.6;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 5;
      lfo.connect(lfoAmt);
      lfo.start(t); lfo.stop(stop);
      [-12, 0, 11].forEach((c) => {
        const o = detuneOsc(ctx, 'sawtooth', f, c, t, stop);
        lfoAmt.connect(o.detune);
        o.connect(filt);
      });
      env(ctx, out, t, note.dur, vel * 0.22, 0.42 * atk, 0.6);
      break;
    }
    case 'air': {
      const stop = t + note.dur + 0.8;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = f * 2; filt.Q.value = 3.5;
      filt.connect(out);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx); src.loop = true;
      src.connect(filt); src.start(t); src.stop(stop);
      detuneOsc(ctx, 'sine', f, 0, t, stop).connect(out);
      env(ctx, out, t, note.dur, vel * 0.16, 0.55 * atk, 0.7);
      break;
    }
    case 'dark':
      simple([-14, 0, 13], 640, 0.35, 0.6, 'sawtooth');
      break;
    case 'lute': {
      const stop = t + note.dur + 1.0;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.Q.value = 1.0;
      filt.frequency.setValueAtTime(3400, t);
      filt.frequency.exponentialRampToValueAtTime(700, t + 0.6);
      filt.connect(out);
      [-4, 5].forEach((c) => detuneOsc(ctx, 'sawtooth', f, c + rough * 20, t, stop).connect(filt));
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(vel * 0.30, t + 0.006 * atk);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 + note.dur * 0.4);
      break;
    }
    case 'pizz': {
      const stop = t + 0.6;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 2600; filt.Q.value = 1.4;
      filt.connect(out);
      detuneOsc(ctx, 'triangle', f, 0, t, stop).connect(filt);
      const click = ctx.createBufferSource();
      click.buffer = noiseBuffer(ctx);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(vel * 0.16, t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      click.connect(cg); cg.connect(filt);
      click.start(t); click.stop(t + 0.05);
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(vel * 0.34, t + 0.005);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.30 + note.dur * 0.2);
      break;
    }
    case 'bell': {
      const stop = t + 2.6;
      [[1, 0.30], [2.76, 0.16], [5.40, 0.08]].forEach(([mult, amp]) => {
        const o = detuneOsc(ctx, 'sine', f * mult, 0, t, stop);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vel * amp, t + 0.008 * atk);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2 + 1.4 / mult);
        o.connect(g); g.connect(out);
      });
      break;
    }
    case 'flute': {
      const stop = t + note.dur + 0.35;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.2;
      const amt = ctx.createGain(); amt.gain.value = 7;
      lfo.connect(amt); lfo.start(t); lfo.stop(stop);
      const o = detuneOsc(ctx, 'sine', f, 0, t, stop);
      amt.connect(o.detune);
      o.connect(out);
      const breath = ctx.createBufferSource();
      breath.buffer = noiseBuffer(ctx); breath.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f * 2.2; bp.Q.value = 6;
      const bg = ctx.createGain(); bg.gain.value = vel * (0.05 + rough * 0.10);
      breath.connect(bp); bp.connect(bg); bg.connect(out);
      breath.start(t); breath.stop(stop);
      env(ctx, out, t, note.dur, vel * 0.30, 0.09 * atk, 0.18);
      break;
    }
    default:
      simple([0], 2000, 0.05, 0.2, 'triangle');
  }
}

function playHit(ctx, dest, hit) {
  const t = hit.t;
  const vel = hit.vel;
  const out = ctx.createGain();
  out.connect(dest);

  const noise = (cut, type, q, decay, amp) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const filt = ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = cut; filt.Q.value = q;
    src.connect(filt); filt.connect(out);
    src.start(t); src.stop(t + decay + 0.05);
    out.gain.setValueAtTime(vel * amp, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  };
  const thump = (from, to, decay, amp) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + decay * 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + decay + 0.05);
  };

  switch (hit.kind) {
    case 'kick':   thump(140, 46, 0.34, 0.62); break;
    case 'tom':    thump(190, 92, 0.40, 0.50); break;
    case 'snare':  noise(1900, 'bandpass', 1.1, 0.17, 0.22); thump(200, 150, 0.10, 0.14); break;
    case 'shaker': noise(7200, 'highpass', 0.8, 0.055, 0.16); break;
    case 'wood':   noise(2500, 'bandpass', 9.0, 0.05, 0.30); break;
    case 'frame':  noise(420, 'lowpass', 1.0, 0.24, 0.30); thump(110, 74, 0.22, 0.30); break;
    default: break;
  }
}

/* Wires the mix and schedules every note. Works on a live AudioContext and on
   an OfflineAudioContext without changes — which is how the download and the
   tests both get their audio. */
function renderScore(ctx, score, p, startAt) {
  const t0 = startAt === undefined ? ctx.currentTime + 0.08 : startAt;

  const master = ctx.createGain();
  /* A shy wizard should sound softer than a raging barbarian, but not four
     times softer — at that distance the quiet one reads as broken rather than
     as quiet. Half of the difference is compensated back here, which keeps the
     direction of the character and drops the range to something listenable. */
  master.gain.value = 0.9 * Math.pow(0.62 / p.dyn, 0.7);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.18;
  master.connect(limiter);
  limiter.connect(ctx.destination);

  const wet = ctx.createGain();
  wet.gain.value = p.rev;
  const dry = ctx.createGain();
  dry.gain.value = 1 - p.rev * 0.45;
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 1.2 + p.rev * 2.6, 2.6);
  wet.connect(verb); verb.connect(master); dry.connect(master);

  const bus = (level) => {
    const g = ctx.createGain();
    g.gain.value = level;
    g.connect(dry); g.connect(wet);
    return g;
  };

  const leadBus = bus(1.0);
  const counterBus = bus(0.62);
  const padBus = bus(0.52);
  const bassBus = bus(0.80);
  const percBus = ctx.createGain();
  percBus.gain.value = 0.72;
  percBus.connect(dry);
  const percWet = ctx.createGain();
  percWet.gain.value = 0.35;
  percBus.connect(percWet); percWet.connect(wet);

  const shift = (n) => ({ ...n, t: n.t + t0 });
  score.tracks.lead.forEach((n) => playNote(ctx, leadBus, p.lead, shift(n), p));
  score.tracks.counter.forEach((n) => playNote(ctx, counterBus, p.counter || p.lead, shift(n), p));
  score.tracks.pad.forEach((n) => playNote(ctx, padBus, p.pad, shift(n), p));
  score.tracks.bass.forEach((n) => playNote(ctx, bassBus, p.drone ? 'dark' : 'strings', shift(n), p));
  score.tracks.perc.forEach((h) => playHit(ctx, percBus, shift(h)));

  return t0 + score.duration;
}

window.Music = { composeScore, renderScore, rng, freqOf, buildCell };
