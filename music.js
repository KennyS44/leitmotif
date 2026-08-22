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

/* Where each part sits, in semitones above the character's root. The order is
   fixed and the whole stack moves together, so a low character lowers the
   entire band rather than dropping its melody underneath its own accompaniment
   — which is what made the low characters sound muddy and quarrelsome. */
const BASS = 0;
const PAD = 12;
const COUNTER = 19;
const LEAD = 26;

/* A A' B A''. The B phrase lifts the same motif to a different step of the
   scale — contrast without introducing a stranger. */
const FORM = [
  { roles: ['state', 'vary', 'state', 'close'], lift: 0, chords: 'home' },
  { roles: ['state', 'vary', 'turn',  'close'], lift: 0, chords: 'home' },
  { roles: ['turn',  'vary', 'turn',  'close'], lift: 3, chords: 'away' },
  { roles: ['state', 'vary', 'state', 'close'], lift: 0, chords: 'home' },
];

/* Who is playing in each phrase.
 *
 * Open any arranged song in a sequencer and the striking thing is how much of
 * the grid is empty: drums start late, the bass waits, layers arrive and leave
 * at section boundaries, and usually only one quiet background part runs the
 * whole length. A band where every instrument plays every bar is not an
 * arrangement — it is everyone talking at once, which is what the earlier
 * version sounded like.
 *
 * So the four phrases are staged. The theme starts nearly bare, gathers, builds
 * through the contrast phrase, and comes back full. */
function staging(phrase, buildAt, bare, flags) {
  return {
    pad: phrase >= 1,
    counter: phrase >= buildAt,
    /* a hushed character keeps one layer to itself: the band thins out around
       the melody instead of the melody merely turning its volume down */
    hue: phrase >= 1 && phrase !== 3 && !flags.hushed,
    kit: phrase < bare || (flags.hushed && phrase < 2) ? 'spare' : 'full',
    build: phrase === buildAt,
  };
}

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
  const cell = (p.cell && p.cell.length ? p.cell : [2, 0, 1, 0, 2, 0, 1, 0]).slice();
  const rand = rng(p.seed ^ 0x9e3779b9);

  let budget = Math.round(p.cellMod * 8);
  /* thinning takes the weakest notes first, filling adds off-beats: a calm
     character breathes, a restless one fidgets, and both keep the accents */
  while (budget < 0) {
    const weak = [];
    cell.forEach((v, i) => { if (v === 1) weak.push(i); });
    /* a bar with one onset is not a rhythm, it is a metronome — traits may
       thin the cell but never strip it below two places to put a note */
    if (!weak.length || cell.filter(Boolean).length <= 2) break;
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
  const beats = p.beats || 4;
  const barDur = beat * beats;

  const cell = buildCell(p);
  const SLOTS = cell.length;
  const slotDur = barDur / SLOTS;
  const swing = p.swing || 0;
  /* off-beats pushed late: the difference between marching and lurching */
  const timeOf = (slot) => slot * slotDur + (slot % 2 ? swing * slotDur * 0.5 : 0);

  const onsets = onsetsOf(cell);
  const motif = (p.motif && p.motif.length ? p.motif : [0, 2, 4, 2]).slice();
  const branch = p.branchMotif || null;
  const spread = 0.70 + p.leap;      /* traits widen or narrow the same shape */

  /* Notes shorter than this read as a stab rather than as part of a line, no
     matter what the tempo is. Everything gets a small overlap on top, so one
     note is still sounding as the next begins. */
  const MIN_NOTE = 0.16;
  const OVERLAP = 0.04;

  const stack = Math.max(-12, Math.min(12, p.reg));
  const bassRoot = p.root + BASS + stack;
  const padRoot = p.root + PAD + stack;
  const floor = padRoot + 12;        /* nothing melodic may sink into the pad */
  /* A motif that dips below its starting note would drag the melody down into
     the chord. Rather than clamping the notes — which would flatten the shape —
     the whole melody is lifted by however far its motif reaches down. */
  const dip = Math.min(0, ...motif.map((d) => scalePitch(p, d)));
  const counterCentre = p.root + COUNTER + stack - dip;
  const leadCentre = p.root + LEAD + stack - dip;

  const tracks = { lead: [], counter: [], hue: [], pad: [], bass: [], perc: [] };

  /* The shape of the piece is the character's too, not a constant. Which
     progression, where the swell falls and how long the bare opening lasts all
     come from the sheet — otherwise every theme wears the same skeleton and the
     differences between them are only ever paint. */
  const shape = rng((p.seed ^ 0x2545f491) >>> 0);
  const ranked = HOME_CHORDS.slice().sort(
    (a, b) => Math.abs(a.settled - p.cadence) - Math.abs(b.settled - p.cadence));
  const homePick = shape() < 0.65 ? ranked[0] : ranked[1];
  const buildAt = shape() < 0.5 ? 1 : 2;
  const bare = shape() < 0.35 ? 2 : 1;

  /* A bar of five beats lasts a quarter longer than a bar of four, and sixteen
     of them run past a minute. Wide metres get three-bar phrases so that every
     character lands near the same shareable length. */
  const barsPerPhrase = beats >= 5 ? 3 : BARS_PER_PHRASE;
  const trim = (arr) => (barsPerPhrase === 4 ? arr : [arr[0], arr[1], arr[3]]);

  for (let ph = 0; ph < PHRASES; ph += 1) {
    const form = FORM[ph];
    const plan = staging(ph, buildAt, bare, p.flags || {});
    const roles = trim(form.roles);
    const chords = trim(form.chords === 'home' ? homePick.degrees : AWAY_CHORDS);
    /* only the contrast phrase moves; the A phrases all sit at the same height
       so that the last one is heard as a return and not as a third idea */
    const lift = form.lift ? form.lift + Math.round(p.rise * 3) : 0;

    for (let b = 0; b < barsPerPhrase; b += 1) {
      const bar = ph * barsPerPhrase + b;
      const t = bar * barDur;
      const role = roles[b];
      const chordDeg = chords[b];
      const lastBar = ph === PHRASES - 1 && b === barsPerPhrase - 1;
      /* the contrast phrase leans in bar by bar instead of arriving already
         loud — the swell is the only place in the piece that goes anywhere */
      const swell = plan.build ? 0.78 + 0.22 * (b / (barsPerPhrase - 1)) : 1;

      /* --- harmony: one chord per bar, held across bars that repeat ---
         Close position only, no octave doubling on top: a spread chord reaches
         up into the melody's register and the two start fighting over the same
         air. The pad's job is to sit underneath and be forgotten. */
      const deg = lastBar ? 0 : chordDeg;
      const nextDeg = b + 1 < barsPerPhrase ? chords[b + 1] : -99;
      const held = deg === nextDeg;   /* same chord next bar: do not re-strike */
      const prevDeg = b > 0 ? chords[b - 1] : -99;
      if (plan.pad && deg !== prevDeg) {
        const tones = padVoicing(p, deg);
        const len = (held ? barDur * 2 : barDur) - OVERLAP;
        tones.forEach((semi) => {
          tracks.pad.push({ t, midi: padRoot + semi, dur: len + OVERLAP * 2,
                            vel: 0.28 + p.dyn * 0.10 });
        });
      }

      /* --- bass: the accents of the cell, nothing else --------------- */
      if (p.drone && b === 0) {
        const len = barDur * barsPerPhrase * 0.99;
        tracks.bass.push({ t, midi: bassRoot, dur: len, vel: 0.38 });
        tracks.bass.push({ t, midi: bassRoot + 7, dur: len, vel: 0.28 });
      }
      /* ionian bends no degree, so it gets a pedal instead: the bass stays on
         the tonic under the moving chords, which is a colour of its own */
      const pedal = p.colour === null;
      const chordRoot = ((scalePitch(p, pedal ? 0 : deg) % 12) + 12) % 12;
      const accents = cell.map((v, s) => (v === 2 ? s : -1)).filter((s) => s >= 0);
      accents.forEach((s, i) => {
        const nextAccent = i + 1 < accents.length ? accents[i + 1] : SLOTS;
        /* both the root and its fifth are folded into the octave below the pad,
           so the bass can never climb over the chord sitting above it */
        const semi = i === 0 ? chordRoot : (chordRoot + 7) % 12;
        tracks.bass.push({
          t: t + timeOf(s), midi: bassRoot + semi,
          dur: Math.max(MIN_NOTE, (nextAccent - s) * slotDur) + OVERLAP,
          vel: 0.42 + p.dyn * 0.14,
        });
      });

      /* --- melody: the motif, laid on the cell ----------------------
         Decisions inside a bar depend on the bar's role and position, never on
         how many bars came before it. That is what lets the fourth phrase come
         back as the first one rather than as something merely similar. */
      const barRand = rng((p.seed ^ ROLE_SALT[role] ^ (b * 2654435761)) >>> 0);
      const leadStart = tracks.lead.length;
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
        /* Once a phrase, land on the mode's colour note. Without this the mode
           exists only in the scale the other notes happen to avoid, and every
           alignment ends up sounding like the same plain major. */
        const isColour = p.colour !== null && role === 'vary' && last;
        if (isColour) degree = lift + p.colour;
        if (lastBar && last) degree = 0;

        const next = i + 1 < onsets.length ? onsets[i + 1] : SLOTS;
        const gap = (next - slot) * slotDur;
        const dur = Math.max(MIN_NOTE, gap * p.legato) + OVERLAP;
        const accent = cell[slot] === 2;
        /* a scarred voice does not sound rough so much as unreliable: every so
           often a note simply does not come out */
        if ((p.flags || {}).brittle && !accent && barRand() < 0.18) return;
        tracks.lead.push({
          t: t + timeOf(slot),
          midi: Math.max(floor, leadCentre + scalePitch(p, degree)),
          dur,
          accent,
          colour: isColour && !(lastBar && last),
          /* the swing between accented and unaccented notes is small on
             purpose: a line whose loudness keeps jumping stops being heard as
             one line and starts being heard as separate events */
          vel: p.dyn * (accent ? 1.0 : 0.86) * swell,
        });

        /* ornaments only decorate accents, and only sometimes — scattered
           grace notes were half of why the first version sounded loose */
        if (accent && barRand() < p.orn * 0.5 && slot > 0) {
          tracks.lead.push({
            t: t + timeOf(slot) - slotDur * 0.26,
            midi: leadCentre + scalePitch(p, degree + 1),
            dur: slotDur * 0.22,
            vel: p.dyn * 0.55,
            grace: true,
          });
        }
      });

      /* --- the second class: an answer, not a rival ------------------
         The fork used to run beside the melody on its own notes, and two lines
         moving at once are heard as two tunes that happen to share a room. It
         now speaks in the melody's silences and joins it on the bar's last
         accent, a third below. Answering and agreeing are what make two voices
         sound like one piece of music. */
      if (plan.counter && branch) {
        /* The fork is what the second class actually says, so it is kept for
           the bars that are answers — and only those. Speaking in every bar is
           what turned "and also a rogue" into a rogue playing a different
           song. */
        if (role === 'vary' || role === 'turn') {
          const fork = shapeMotif(branch, 'turn');
          const gaps = cell.map((v, s) => (v ? -1 : s)).filter((s) => s > 0);
          gaps.slice(0, fork.length).forEach((slot, i) => {
            tracks.counter.push({
              t: t + timeOf(slot),
              midi: Math.max(floor, counterCentre + scalePitch(p, lift + fork[i])),
              dur: Math.max(MIN_NOTE, slotDur * 1.5 * p.legato) + OVERLAP,
              vel: p.dyn * 0.44 * swell,
            });
          });
        }
        /* In every bar it is present, including the ones where it says nothing
           of its own, it lands on the melody's last note with it, a third
           below. Agreeing on the cadence is what makes two voices one band. */
        const together = tracks.lead[tracks.lead.length - 1];
        if (together && !together.grace) {
          tracks.counter.push({
            t: together.t,
            midi: Math.max(floor, together.midi - 5 - (p.tension > 0.5 ? 1 : 0)),
            dur: together.dur,
            vel: together.vel * 0.55,
          });
        }
      }

      /* --- the race's own instrument: reinforcement, not a rival -----
       *
       * This part used to invent its own line — chord tones on every accent of
       * nearly every bar, in its own instrument, for three phrases out of four.
       * That is a second tune by construction, and it is most of the reason
       * some pairings were heard as several pieces of music at once.
       *
       * Two instruments fuse into one voice when they play the same notes at
       * the same instant, and split into two streams when they play different
       * notes at different times. So the colour instrument now plays the
       * melody's own accents, struck together with it, an octave down — it
       * thickens the theme instead of running beside it.
       *
       * And it does not stay. It comes in at the head of a phrase and through
       * the build, where the arrangement wants weight, then leaves. An
       * instrument that is present the whole way is heard as a part; one that
       * arrives for a moment is heard as an accent. */
      const shine = plan.hue && p.hue && (b === 0 || plan.build);
      if (shine) {
        tracks.lead.slice(leadStart)
          .filter((n) => n.accent && !n.grace)
          .forEach((n) => {
            tracks.hue.push({
              /* exactly together with the melody note: any gap and the ear
                 hears two players rather than one thicker sound */
              t: n.t,
              /* an octave below, so the doubling adds body without taking the
                 top of the mix away from the melody it is reinforcing —
                 except at the peak of the build, where unison is the weight */
              /* clamping to the floor would land on some other pitch entirely
                 and clash; if there is no room below, double at pitch */
              midi: !plan.build && n.midi - 12 >= floor ? n.midi - 12 : n.midi,
              dur: Math.max(n.dur, slotDur * 1.4),
              vel: p.dyn * 0.30 * swell,
            });
          });
      }

      /* --- percussion --------------------------------------------- */
      addPerc(tracks.perc, p, t, timeOf, cell, beats, plan, swell,
              b === barsPerPhrase - 1);
    }
  }

  /* --- the ending -------------------------------------------------
     The theme used to stop and let the reverb carry it away, which reads as
     running out rather than finishing. It now lands: every part strikes the
     tonic together, once, and holds. A piece that ends on a decision sounds
     finished; one that fades sounds abandoned. */
  const endAt = PHRASES * barsPerPhrase * barDur;
  /* Not every character finishes the same way. A hot-headed one stops the way
     it speaks — the chord is struck and cut. A settled one is allowed to ring.
     A single ending for everybody was the tell that the form was a template. */
  const flags = p.flags || {};
  const abrupt = flags.abrupt && !flags.settled;
  const hold = abrupt ? Math.max(0.35, barDur * 0.22)
    : Math.max(1.8, barDur * (flags.settled ? 1.2 : 0.9));
  const tonic = scalePitch(p, 0);
  tracks.bass.push({ t: endAt, midi: bassRoot + tonic, dur: hold, vel: 0.62 });
  padVoicing(p, 0).forEach((semi) => {
    tracks.pad.push({ t: endAt, midi: padRoot + semi, dur: hold, vel: 0.40 });
  });
  tracks.lead.push({ t: endAt, midi: leadCentre + tonic, dur: hold, vel: Math.min(1, p.dyn * 1.15) });
  if (p.hue) tracks.hue.push({ t: endAt, midi: padRoot + 12 + tonic, dur: hold, vel: 0.42 });
  /* No gong. A long metallic wash at the end belongs to a different kind of
     music and read as an extension stuck on rather than as this piece
     finishing. The band landing together on the tonic is the ending. */
  if (p.perc) tracks.perc.push({ t: endAt, kind: 'kick', vel: 0.58 + p.dyn * 0.22 });

  /* an abrupt ending gets almost no room afterwards — the silence is the point */
  const duration = endAt + hold + (abrupt ? 0.5 : 1.6);
  return { duration, barDur, beats, barsPerPhrase, cell, motif, swing, endAt,
           buildAt, bare, abrupt, tracks };
}

/* The pad's voicing, and the one place the mode's colour is guaranteed to be
   heard in the harmony even if the melody is busy elsewhere. */
function padVoicing(p, deg) {
  const flags = p.flags || {};
  /* An old character gets harmony older than the third: bare fifths, the sound
     of music before anyone agreed that thirds were consonant. It is the
     cheapest way to make a theme feel remembered rather than composed. */
  if (flags.archaic) {
    return [...new Set([scalePitch(p, deg), scalePitch(p, deg + 4), scalePitch(p, deg) + 12]
      .map((s) => ((s % 12) + 12) % 12))];
  }
  const tones = [0, 2, 4];
  if (p.colour === null) tones[1] = 3;        /* suspended fourth for ionian */
  if (p.tension > 0.45) tones.push(6);        /* a seventh on top */
  const out = tones.map((s) => scalePitch(p, deg + s));
  if (p.colour !== null && p.tension > 0.25) out.push(scalePitch(p, p.colour));
  /* folded into a single octave, so that a chord with a seventh on top cannot
     climb into the melody's register and start an argument with it */
  return [...new Set(out.map((s) => ((s % 12) + 12) % 12))];
}

/* A kit that only strikes where the melody strikes is not a kit — it is the
 * melody again, an octave down and made of noise, which is why it read as "the
 * opening note of a chord and nothing else".
 *
 * A real kit does three jobs at once and they are on different clocks: a low
 * drum marks the character's accents, a higher one answers on the back of the
 * beat, and something small keeps the subdivision ticking underneath. The third
 * job is what fills the silence the melody leaves; without it there is a floor
 * missing under the whole piece.
 */
function addPerc(out, p, t, timeOf, cell, beats, plan, swell, lastOfPhrase) {
  if (!p.perc) return;
  const slots = cell.length;
  const perBeat = slots / beats;
  const v = (0.42 + p.dyn * 0.25) * swell;
  const push = (slot, kind, vel) => out.push({ t: t + timeOf(slot), kind, vel });

  const LOW = { martial: 'kick', heavy: 'kick', light: 'kick', frame: 'frame', wood: 'wood', tick: 'kick' };
  const BACK = { martial: 'snare', heavy: 'tom', light: 'snare', frame: 'frame', wood: 'wood', tick: 'tick' };
  const TICK = { martial: 'shaker', heavy: 'shaker', light: 'shaker', frame: 'shaker', wood: 'wood', tick: 'tick' };

  /* 1. the character's own accents, on the low drum */
  cell.forEach((val, s) => {
    if (val === 2) push(s, LOW[p.perc], v * (p.perc === 'heavy' ? 1.15 : 1.0));
  });

  /* 2. the back of the beat — its own clock, not the cell's */
  if (plan.kit === 'full' && Number.isInteger(perBeat)) {
    for (let b2 = 1; b2 < beats; b2 += 2) push(b2 * perBeat, BACK[p.perc], v * 0.62);
  }

  /* 3. the subdivision underneath, quiet, filling what the melody leaves */
  if (plan.kit === 'full') {
    for (let s = 0; s < slots; s += 1) {
      if (cell[s] === 2) continue;
      const weak = s % 2 === 1;
      push(s, TICK[p.perc], v * (weak ? 0.16 : 0.24));
    }
  }

  /* 4. a fill on the way out of a phrase, so the seam is heard */
  if (lastOfPhrase && plan.kit === 'full') {
    push(slots - 2, BACK[p.perc], v * 0.7);
    push(slots - 1, BACK[p.perc], v * 0.85);
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
/* how much of a voice's detune survives, by note length */
const spread = (dur) => (dur > 1.2 ? 0.40 : (dur > 0.6 ? 0.65 : 0.9));

/* Roughness reads much stronger than the number suggests, so the number is
   pulled back before anything uses it. */
const grit = (rough) => rough * 0.55;

function playNote(ctx, dest, voice, note, p) {
  const t = note.t;
  /* a couple of cents off true, the way a real player is */
  const f = freqOf(note.midi) * Math.pow(2, (note.cents || 0) / 1200);
  const vel = Math.max(0.02, note.vel);
  const rough = grit(p.rough);
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
    cents.forEach((c, i) => {
      /* Detuned copies beat against each other, and on a long note the beating
         is slow enough to be heard as the pitch wandering. So the spread is
         narrowed as the note lengthens. The offset is derived from the note
         rather than drawn at random, because the same sheet must give the same
         sound on every machine. */
      const o = detuneOsc(ctx, wave, f, (c + (i - 1) * rough * 12) * spread(note.dur), t, stop);
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
      [-7 - rough * 14, 6 + rough * 14].forEach((c) => detuneOsc(ctx, 'sawtooth', f, c * spread(note.dur), t, stop).connect(filt));
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
      [-10 - rough * 16, 9 + rough * 16].forEach((c) => detuneOsc(ctx, 'sawtooth', f, c * spread(note.dur), t, stop).connect(filt));
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
        const o = detuneOsc(ctx, 'sawtooth', f, c * spread(note.dur), t, stop);
        lfoAmt.connect(o.detune);
        o.connect(filt);
      });
      env(ctx, out, t, note.dur, vel * 0.22, 0.42 * atk, 0.6);
      break;
    }
    case 'air': {
      /* This used to be a loop of noise through a band-pass, and looping noise
         under a long chord is exactly the restless hiss that reads as rubbish
         rather than as a pad. It is now three quiet tones a hair apart, with
         only a breath of noise on top. */
      const stop = t + note.dur + 0.8;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1800; filt.Q.value = 0.6;
      filt.connect(out);
      [-3, 0, 4].forEach((c) => detuneOsc(ctx, 'triangle', f, c, t, stop).connect(filt));
      detuneOsc(ctx, 'sine', f * 2, 0, t, stop).connect(filt);
      const air = ctx.createBufferSource();
      air.buffer = noiseBuffer(ctx); air.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f * 3; bp.Q.value = 2;
      const ag = ctx.createGain(); ag.gain.value = vel * 0.02;
      air.connect(bp); bp.connect(ag); ag.connect(out);
      air.start(t); air.stop(stop);
      env(ctx, out, t, note.dur, vel * 0.20, 0.55 * atk, 0.7);
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
      [-4, 5].forEach((c) => detuneOsc(ctx, 'sawtooth', f, (c + rough * 12) * spread(note.dur), t, stop).connect(filt));
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
      env(ctx, out, t, note.dur, vel * 0.30, 0.09 * atk, 0.30);
      break;
    }
    case 'harp': {
      /* plain and clean: fundamental plus two quiet partials, struck and left
         to ring. No feedback delay line — a real plucked-string model needs a
         delay shorter than one render block at these pitches, which browsers
         will not give inside a loop. */
      const stop = t + 2.2;
      [[1, 0.30], [2, 0.10], [3, 0.05]].forEach(([mult, amp]) => {
        const o = detuneOsc(ctx, mult === 1 ? 'triangle' : 'sine', f * mult, 0, t, stop);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vel * amp, t + 0.004 * atk);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 / mult + note.dur * 0.3);
        o.connect(g); g.connect(out);
      });
      break;
    }
    case 'fiddle': {
      const stop = t + note.dur + 0.3;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.Q.value = 1.6;
      filt.frequency.setValueAtTime(2800, t);
      filt.connect(out);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.8;
      const amt = ctx.createGain(); amt.gain.value = 9;
      lfo.connect(amt); lfo.start(t); lfo.stop(stop);
      [-6, 7].forEach((c) => {
        const o = detuneOsc(ctx, 'sawtooth', f, c * spread(note.dur), t, stop);
        amt.connect(o.detune);
        o.connect(filt);
      });
      /* a little rosin on the attack, which is most of what says "fiddle" */
      const scrape = ctx.createBufferSource();
      scrape.buffer = noiseBuffer(ctx);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(vel * 0.10, t);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      scrape.connect(sg); sg.connect(filt);
      scrape.start(t); scrape.stop(t + 0.08);
      env(ctx, out, t, note.dur, vel * 0.26, 0.05 * atk, 0.22);
      break;
    }
    case 'organ': {
      const stop = t + note.dur + 0.25;
      [[1, 0.22], [2, 0.13], [3, 0.08], [4, 0.06], [6, 0.03]].forEach(([mult, amp]) => {
        const o = detuneOsc(ctx, 'sine', f * mult, 0, t, stop);
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g); g.connect(out);
      });
      env(ctx, out, t, note.dur, vel * 0.68, 0.04 * atk, 0.14);
      break;
    }
    case 'whistle': {
      /* breathier and lower than the flute: more air than tone, which is what
         gives the ancient, mournful reading */
      const stop = t + note.dur + 0.3;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.2;
      const amt = ctx.createGain(); amt.gain.value = 12;
      lfo.connect(amt); lfo.start(t); lfo.stop(stop);
      const o = detuneOsc(ctx, 'sine', f, 0, t, stop);
      amt.connect(o.detune);
      o.connect(out);
      const breath = ctx.createBufferSource();
      breath.buffer = noiseBuffer(ctx); breath.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f * 1.6; bp.Q.value = 3;
      const bg = ctx.createGain(); bg.gain.value = vel * 0.16;
      breath.connect(bp); bp.connect(bg); bg.connect(out);
      breath.start(t); breath.stop(stop);
      env(ctx, out, t, note.dur, vel * 0.26, 0.14 * atk, 0.34);
      break;
    }
    case 'pulse': {
      /* the artificer is the one class whose century is not the others': a
         square wave with a moving filter is a machine, not a minstrel */
      const stop = t + note.dur + 0.2;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.Q.value = 2.4;
      filt.frequency.setValueAtTime(380 + 2000 * vel, t);
      filt.frequency.exponentialRampToValueAtTime(600, t + note.dur + 0.2);
      filt.connect(out);
      /* one square for the machine, one triangle for the hand holding it */
      detuneOsc(ctx, 'square', f, -4, t, stop).connect(filt);
      detuneOsc(ctx, 'triangle', f, 5, t, stop).connect(filt);
      detuneOsc(ctx, 'sine', f / 2, 0, t, stop).connect(filt);
      env(ctx, out, t, note.dur, vel * 0.21, 0.035 * atk, 0.16);
      break;
    }
    case 'glass': {
      const stop = t + 2.4;
      [[1, 0.24], [2.005, 0.09], [3.01, 0.04]].forEach(([mult, amp]) => {
        const o = detuneOsc(ctx, 'sine', f * mult, 0, t, stop);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vel * amp, t + 0.22 * atk);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1 + note.dur * 0.4);
        o.connect(g); g.connect(out);
      });
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
    case 'tick':   noise(5200, 'bandpass', 12.0, 0.03, 0.26); break;
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

  /* Everything except the bass is cleared out below its own lowest note. Two
     parts both putting energy at the bottom is what mud is: neither is heard
     down there, and both lose definition higher up. A gentle dip around 3 kHz
     takes the glare off the sawtooth voices at the same time. */
  const bus = (level, clean, ceiling) => {
    const g = ctx.createGain();
    g.gain.value = level;
    let node = g;
    /* A ceiling on brightness, handed down by the map. Whatever is brightest in
       a mix is heard as the melody, so an accompanying instrument that shines
       above the lead gets promoted by the ear into a tune of its own. Rolling
       its top off is what puts it back underneath — and it is decided from the
       pair that actually met, not from a fixed number. */
    if (ceiling) {
      const lid = ctx.createBiquadFilter();
      lid.type = 'lowpass';
      lid.frequency.value = ceiling;
      lid.Q.value = 0.6;
      node.connect(lid);
      node = lid;
    }
    if (clean) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = clean;
      hp.Q.value = 0.7;
      node.connect(hp);
      const tame = ctx.createBiquadFilter();
      tame.type = 'peaking';
      tame.frequency.value = 3000;
      tame.Q.value = 1.0;
      tame.gain.value = -3.5;
      hp.connect(tame);
      node = tame;
    }
    node.connect(dry); node.connect(wet);
    return g;
  };

  const low = freqOf(p.root + 12);          /* the pad's own bottom note */
  /* The trims the map worked out for this particular set of instruments. A harp
     sits differently behind a brass paladin than behind a choir cleric, and the
     fixed levels that used to be here were part of why some pairings read as
     two pieces of music playing at once. */
  const bl = p.blend || {};
  const fit = (k) => bl[k] || { gain: 1, tone: 0 };
  const leadBus = bus(1.0, low * 1.5);
  const counterBus = bus(0.62 * fit('counter').gain, low * 1.2, fit('counter').tone);
  const hueBus = bus(0.50 * fit('hue').gain, low * 1.2, fit('hue').tone);
  const padBus = bus(0.52 * fit('pad').gain, low * 0.9, fit('pad').tone);
  const bassBus = bus(0.80);                /* the only part allowed down there */
  const percBus = ctx.createGain();
  percBus.gain.value = 0.72;
  percBus.connect(dry);
  const percWet = ctx.createGain();
  percWet.gain.value = 0.22;                /* dry drums, so they stay tight */
  percBus.connect(percWet); percWet.connect(wet);

  /* THE PERFORMANCE LAYER.
   *
   * Up to here the score is exact: every note begins on its slot, at the level
   * the map asked for, at concert pitch. Exactness is the whole reason it
   * sounds like a machine — no player alive puts two notes down at precisely
   * the same distance twice, and the ear reads that precision as artificial
   * long before it can say why.
   *
   * So the last thing that happens before the sound is made is a small,
   * deliberate mess: a few milliseconds either side of the beat, a few percent
   * either side of the level, a couple of cents either side of the pitch. Drawn
   * from the character's own seed, so the same sheet still plays the same way
   * everywhere — the untidiness is composed, not random.
   *
   * Each part draws from its own stream, salted by name, and not from one
   * shared one. With a single stream the draws are handed out in track order,
   * so removing a note from an early part shifts every draw belonging to every
   * later part: take the second voice out and the drums, the bass and the pad
   * are all re-performed, from the first bar. Two things change when one was
   * meant to. That made A/B comparisons meaningless and, worse, quietly
   * reshuffled the feel of the whole band after any edit to a note count.
   */
  const SALT = { lead: 0x632be59b, counter: 0x85ebca6b, hue: 0xc2b2ae35,
                 pad: 0x27d4eb2f, bass: 0x165667b1, perc: 0x9e3779b1 };
  const performer = (part) => {
    const human = rng((p.seed ^ SALT[part]) >>> 0);
    return (n) => {
      const late = (human() - 0.5) * 0.016;
      return {
        ...n,
        /* a grace note before the first beat, nudged earlier still, can land
           before the start of an offline render, where time cannot be negative */
        t: Math.max(0, n.t + t0 + late),
        vel: n.vel === undefined ? n.vel : n.vel * (0.93 + human() * 0.14),
        cents: (human() - 0.5) * 5,
      };
    };
  };
  const play = (part, fn) => {
    const shift = performer(part);
    score.tracks[part].forEach((n) => fn(shift(n)));
  };
  play('lead', (n) => playNote(ctx, leadBus, p.lead, n, p));
  play('counter', (n) => playNote(ctx, counterBus, p.counter || p.lead, n, p));
  play('hue', (n) => playNote(ctx, hueBus, p.hue || 'harp', n, p));
  play('pad', (n) => playNote(ctx, padBus, p.pad, n, p));
  play('bass', (n) => playNote(ctx, bassBus, p.drone ? 'dark' : 'strings', n, p));
  play('perc', (h) => playHit(ctx, percBus, h));

  return t0 + score.duration;
}

window.Music = { composeScore, renderScore, rng, freqOf, buildCell };
