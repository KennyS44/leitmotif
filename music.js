'use strict';

/* The generic half: a small composer and a small synthesiser.
 *
 * Neither knows anything about D&D. They are handed the parameter block that
 * mapping.js produced and they play it. The split matters: it means the sound
 * can be improved without touching the character logic, and the character
 * logic can be re-tuned without breaking the sound.
 *
 * composeScore() returns plain data — a list of notes with times. Nothing is
 * audible about it, which is exactly why it can be tested.
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

/* Chord movements, written as scale degrees. The firmer the character's
   cadence, the more likely we pick one that returns home. */
const PROGRESSIONS = [
  { degrees: [0, 3, 4, 0], home: 1.0 },
  { degrees: [0, 5, 3, 4], home: 0.6 },
  { degrees: [0, 4, 5, 0], home: 0.9 },
  { degrees: [0, 6, 3, 4], home: 0.4 },
  { degrees: [0, 2, 5, 4], home: 0.3 },
];

function scalePitch(p, degree) {
  /* degree may run past the end of the mode — wrap and add octaves */
  const n = p.mode.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return p.mode[idx] + oct * 12;
}

function composeScore(p) {
  const rand = rng(p.seed);
  const beat = 60 / p.tempo;
  const barDur = beat * 4;
  const slotDur = barDur / SLOTS;
  const bars = PHRASES * BARS_PER_PHRASE;

  const bassRoot = p.root;
  const padRoot = p.root + 12;
  const leadCentre = p.root + 24 + p.reg;

  const tracks = {
    lead: [], counter: [], pad: [], bass: [], perc: [],
  };

  /* --- harmony ------------------------------------------------------- */
  const chords = [];
  for (let ph = 0; ph < PHRASES; ph += 1) {
    const pool = PROGRESSIONS.filter((pr) => pr.home >= p.cadence - 0.45);
    const pick = (pool.length ? pool : PROGRESSIONS)[Math.floor(rand() * (pool.length || PROGRESSIONS.length))];
    pick.degrees.forEach((d, i) => {
      /* the last bar of the last phrase always comes home */
      const last = ph === PHRASES - 1 && i === BARS_PER_PHRASE - 1;
      chords.push(last ? 0 : d);
    });
  }

  for (let bar = 0; bar < bars; bar += 1) {
    const t = bar * barDur;
    const deg = chords[bar];
    const tones = [0, 2, 4].map((s) => scalePitch(p, deg + s));
    if (p.tension > 0.40) tones.push(scalePitch(p, deg + 6));       /* seventh */
    if (p.tension > 0.65) tones.push(scalePitch(p, deg + 1) + 12);  /* a rub on top */

    tones.forEach((semi) => {
      tracks.pad.push({ t, midi: padRoot + semi, dur: barDur * 0.98, vel: 0.30 + p.dyn * 0.12 });
    });

    if (p.drone) {
      /* dwarves and their fifths: a bar-long open drone under everything */
      if (bar % BARS_PER_PHRASE === 0) {
        const len = barDur * BARS_PER_PHRASE * 0.99;
        tracks.bass.push({ t, midi: bassRoot, dur: len, vel: 0.40 });
        tracks.bass.push({ t, midi: bassRoot + 7, dur: len, vel: 0.30 });
      }
    }
    tracks.bass.push({ t, midi: bassRoot + tones[0] % 12, dur: beat * 1.6, vel: 0.46 + p.dyn * 0.12 });
    if (p.dens > 0.5) {
      tracks.bass.push({ t: t + beat * 2, midi: bassRoot + (tones[0] % 12) + 7,
                         dur: beat * 1.2, vel: 0.34 + p.dyn * 0.10 });
    }

    /* --- melody ------------------------------------------------------ */
    const phrasePos = bar % BARS_PER_PHRASE;
    const closing = phrasePos === BARS_PER_PHRASE - 1;
    let degree = bar === 0 ? 0 : null;

    for (let s = 0; s < SLOTS; s += 1) {
      const onBeat = s % 2 === 0;
      /* syncopation makes off-beats as likely as beats, and thins the downbeat */
      let chance = p.dens * (onBeat ? 1.0 - p.sync * 0.45 : p.sync * 1.5);
      if (s === 0) chance = Math.max(chance, 0.55);
      if (closing && s > 4) chance *= 0.5 + p.cadence * 0.3;
      if (rand() > chance) continue;

      if (degree === null) degree = pickNext(p, rand, lastDegree(tracks.lead, p, leadCentre), deg);
      else degree = pickNext(p, rand, degree, deg);

      /* land the phrase on a chord tone, the more so the more lawful */
      if (closing && s >= 6 && rand() < p.cadence) degree = nearestChordTone(p, degree, deg);

      const long = rand() < 0.3 ? 2 : 1;
      const dur = slotDur * long * p.legato;
      const midi = leadCentre + scalePitch(p, degree);
      const vel = p.dyn * (onBeat ? 1.0 : 0.82) * (0.88 + rand() * 0.24);
      tracks.lead.push({ t: t + s * slotDur, midi, dur, vel });

      /* an ornament is a flick a step above, just before the note */
      if (rand() < p.orn && s > 0) {
        tracks.lead.push({
          t: t + s * slotDur - slotDur * 0.28,
          midi: leadCentre + scalePitch(p, degree + 1),
          dur: slotDur * 0.24, vel: vel * 0.65,
        });
      }
      s += long - 1;
    }

    /* --- counter-melody: only when a second class brought a voice ----- */
    if (p.counter) {
      for (let s = 1; s < SLOTS; s += 2) {
        if (rand() > p.dens * 0.45) continue;
        const d = Math.floor(rand() * 3) * 2;   /* chord tones only */
        tracks.counter.push({
          t: t + s * slotDur,
          midi: leadCentre - 12 + scalePitch(p, deg + d),
          dur: slotDur * 1.4 * p.legato,
          vel: p.dyn * 0.55,
        });
      }
    }

    /* --- percussion --------------------------------------------------- */
    addPerc(tracks.perc, p, t, beat, rand);
  }

  const duration = bars * barDur + 2.4;
  return { duration, barDur, tracks };
}

function lastDegree(lead, p, centre) {
  if (!lead.length) return 0;
  const last = lead[lead.length - 1].midi - centre;
  /* nearest degree to whatever we ended on */
  let best = 0; let bestD = 99;
  for (let d = -7; d <= 14; d += 1) {
    const diff = Math.abs(scalePitch(p, d) - last);
    if (diff < bestD) { bestD = diff; best = d; }
  }
  return best;
}

function pickNext(p, rand, from, chordDeg) {
  const leap = rand() < p.leap;
  const size = leap ? 2 + Math.floor(rand() * 4) : 1 + (rand() < 0.35 ? 1 : 0);
  /* `rise` tilts the coin: brave characters climb, gloomy ones sink */
  const up = rand() < 0.5 + p.rise * 0.5;
  let next = from + (up ? size : -size);
  if (next > 12) next -= 7;
  if (next < -5) next += 7;
  /* a leap that lands nowhere sounds wrong, so leaps aim at the chord */
  if (leap && rand() < 0.6) next = nearestChordTone(p, next, chordDeg);
  return next;
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

function addPerc(out, p, t, beat, rand) {
  const v = 0.42 + p.dyn * 0.25;
  const push = (off, kind, vel) => out.push({ t: t + off, kind, vel });
  switch (p.perc) {
    case 'martial':
      push(0, 'kick', v); push(beat, 'snare', v * 0.8);
      push(beat * 2, 'kick', v * 0.9); push(beat * 3, 'snare', v * 0.85);
      if (rand() < p.sync) push(beat * 3.5, 'snare', v * 0.5);
      break;
    case 'heavy':
      push(0, 'kick', v * 1.15); push(beat * 1.5, 'kick', v * 0.7);
      push(beat * 2, 'tom', v); push(beat * 3, 'kick', v * 0.9);
      if (rand() < 0.5) push(beat * 3.5, 'tom', v * 0.6);
      break;
    case 'light':
      for (let i = 0; i < 8; i += 1) {
        if (rand() < 0.55 + p.dens * 0.3) push(beat * 0.5 * i, 'shaker', v * 0.35);
      }
      push(0, 'kick', v * 0.6);
      break;
    case 'frame':
      push(0, 'frame', v); push(beat * 1.5, 'frame', v * 0.6);
      push(beat * 2.5, 'frame', v * 0.75);
      if (rand() < p.sync) push(beat * 3.5, 'frame', v * 0.45);
      break;
    case 'wood':
      for (let i = 0; i < 8; i += 1) {
        if (i % 2 === 1 ? rand() < 0.7 : rand() < 0.3) push(beat * 0.5 * i, 'wood', v * 0.45);
      }
      break;
    default:
      break;
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

  const simple = (types, cents, cutoff, attack, release, wave) => {
    const stop = t + note.dur + release + 0.1;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(cutoff * (0.6 + vel * 0.8), t);
    filt.Q.value = 0.7;
    filt.connect(out);
    types.forEach((c) => {
      const o = detuneOsc(ctx, wave, f, c + (Math.random() - 0.5) * rough * 30, t, stop);
      o.connect(filt);
    });
    env(ctx, out, t, note.dur, vel * 0.30, attack * atk, release);
    void cents;
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
      simple([-9, 0, 8], 0, 2300, 0.20, 0.30, 'sawtooth');
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
      simple([-14, 0, 13], 0, 640, 0.35, 0.6, 'sawtooth');
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
      simple([0], 0, 2000, 0.05, 0.2, 'triangle');
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
  master.gain.value = 0.9;
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

window.Music = { composeScore, renderScore, rng, freqOf };
