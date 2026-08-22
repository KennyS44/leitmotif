'use strict';

/* Prototype check. The interesting assertion is not "does it play" but
   "do twelve different sheets produce twelve measurably different pieces of
   audio". Everything is rendered offline, so no sound card is involved.
 *
 * Two levels, because they cost very different amounts:
 *
 *   node test.js          the score — structure, grid, layers, form, blend,
 *                         and every complaint measure that needs no audio.
 *                         Seconds. Runs after each edit.
 *
 *   node test.js --full   all of that, plus rendering every theme to samples.
 *                         Minutes. Runs once, before publishing.
 *
 * Nine tenths of what can break is decided in the score and shows up instantly.
 * Paying for twelve audio renders to discover that a bar line moved was most of
 * the cost of a round. */

const { chromium } = require('/usr/local/lib/node_modules/playwright');

const FULL = process.argv.includes('--full');

const fail = [];
const ok = [];
const open = [];
function check(name, cond, detail) {
  (cond ? ok : fail).push(detail ? `${name} — ${detail}` : name);
}

/* A finding that is real and measured but not yet decided. It is neither hidden
   nor allowed to block a publish: a check that goes red every single run stops
   being read, and a threshold quietly widened to swallow it stops being a
   check. It prints, with its number, until the question behind it is answered —
   and it fails loudly the moment it gets worse than it was when recorded. */
function watch(name, held, detail) {
  const line = detail ? `${name} — ${detail}` : name;
  /* held means "no worse than when it was recorded", which is not the same as
     passing: it stays on the list either way, and only leaves it when the
     question is answered */
  (held ? open : fail).push(line);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:20303/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  /* the complaint measures are a test instrument, not part of the site, so they
     are injected here rather than shipped in a script tag */
  await page.addScriptTag({ path: `${__dirname}/metrics.js` });

  check('page loads with no JS errors', errors.length === 0, errors.join(' | '));
  const cards = await page.locator('.card').count();
  check('every preset is rendered', cards === (await page.evaluate(() => window.PRESETS.length)),
    `${cards} cards`);

  /* --- the scores: structure --------------------------------------- */
  const scores = await page.evaluate(() => window.PRESETS.map((ch) => {
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    const pitches = s.tracks.lead.map((n) => n.midi);
    return {
      name: ch.name,
      tempo: p.tempo, mode: p.modeName, lead: p.lead, pad: p.pad,
      counter: p.counter, perc: p.perc, reg: p.reg, rev: +p.rev.toFixed(2),
      duration: +s.duration.toFixed(1),
      leadNotes: s.tracks.lead.length,
      percHits: s.tracks.perc.length,
      counterNotes: s.tracks.counter.length,
      lowest: Math.min(...pitches), highest: Math.max(...pitches),
      centre: Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length),
    };
  }));

  scores.forEach((s) => {
    /* wider than it was: an abrupt character finishes early on purpose, and a
       settled one in five-four is allowed to take its time */
    check(`${s.name}: theme is 25-65s`, s.duration >= 25 && s.duration <= 65, `${s.duration}s`);
    check(`${s.name}: melody has notes`, s.leadNotes > 20, `${s.leadNotes} notes`);
    check(`${s.name}: melody stays in a singable range`,
      s.highest - s.lowest <= 36, `${s.highest - s.lowest} semitones`);
  });

  const multi = scores.find((s) => s.name === 'Pip Underbough');
  check('multiclass adds a counter-melody', multi.counterNotes > 0, `${multi.counterNotes} notes`);
  scores.filter((s) => !s.counter).forEach((s) => {
    check(`${s.name}: single class has no counter-melody`, s.counterNotes === 0);
  });

  /* --- the three properties the first version lacked ------------------ */

  /* A theme is remembered through repetition. If no bar's shape ever comes
     back, the listener has nothing to hold on to — which is exactly what the
     random-walk version sounded like. */
  const structure = await page.evaluate(() => window.PRESETS.map((ch) => {
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    const barDur = s.barDur;
    const slots = s.cell.length;
    const slot = barDur / slots;
    /* the grid a part is allowed to land on, swing included */
    const allowed = s.cell
      .map((v, i) => (v ? i * slot + (i % 2 ? s.swing * slot * 0.5 : 0) : -1))
      .filter((x) => x >= 0);
    /* a hit landing exactly on a bar line can come back from the modulo as
       "barDur minus a rounding error", so the wrap is compared too */
    const onGridAt = (time) => {
      const rem = time % barDur;
      return allowed.some((a) => Math.abs(rem - a) < 0.003
        || Math.abs(rem - barDur - a) < 0.003);
    };

    /* signature of a bar = its melodic shape, independent of where it sits.
       The closing chord sits past the last bar and is not part of the pattern. */
    const bars = {};
    s.tracks.lead.filter((n) => n.t < s.endAt - 1e-6).forEach((n) => {
      const b = Math.floor(n.t / barDur + 1e-6);
      (bars[b] = bars[b] || []).push(n.midi);
    });
    const sigs = Object.keys(bars).sort((a, b) => a - b).map((b) => {
      const m = bars[b];
      return m.map((v, i) => (i ? v - m[i - 1] : 0)).join(',');
    });
    const counts = {};
    sigs.forEach((sig) => { counts[sig] = (counts[sig] || 0) + 1; });
    const topRepeat = Math.max(...Object.values(counts));

    /* The melody sits on the cell's onsets. The kit is allowed every slot of
       the metre — that is how it fills the space the melody leaves — but it may
       never land between slots. */
    const everySlot = s.cell
      .map((v, i) => i * slot + (i % 2 ? s.swing * slot * 0.5 : 0));
    const onSlotAt = (time) => {
      const rem = time % barDur;
      return everySlot.some((a) => Math.abs(rem - a) < 0.003
        || Math.abs(rem - barDur - a) < 0.003);
    };
    /* grace notes are placed deliberately just before the beat */
    const sung = s.tracks.lead.filter((n) => !n.grace);
    const onGrid = sung.filter((n) => onGridAt(n.t)).length;
    const percOnGrid = s.tracks.perc.filter((h) => onSlotAt(h.t)).length;
    /* and it must actually fill: hits away from the cell's own onsets */
    const percFilling = s.tracks.perc.filter((h) => !onGridAt(h.t)).length;

    /* The opening phrase should return at the end: A A' B A''. The very last
       bar is excluded — it carries the final cadence and is meant to differ. */
    const per = s.barsPerPhrase;
    const first = sigs.slice(0, per - 1).join('|');
    const last = sigs.slice(3 * per, 4 * per - 1).join('|');

    /* how much of the theme is built from material that occurs more than once */
    const recurring = sigs.filter((s) => counts[s] > 1).length / sigs.length;

    return {
      name: ch.name, bars: sigs.length, topRepeat,
      recurring: +recurring.toFixed(2),
      distinctShapes: Object.keys(counts).length,
      onGrid: Math.round(100 * onGrid / sung.length),
      percOnGrid: s.tracks.perc.length
        ? Math.round(100 * percOnGrid / s.tracks.perc.length) : 100,
      percFilling,
      percTotal: s.tracks.perc.length,
      percKinds: new Set(s.tracks.perc.map((h) => h.kind)).size,
      percPerBar: +(s.tracks.perc.length
        / (4 * s.barsPerPhrase)).toFixed(1),
      /* how many parts are sounding in each of the four phrases */
      voicesPerPhrase: (() => {
        const span = s.barsPerPhrase * barDur;
        return [0, 1, 2, 3].map((ph) => {
          const live = (arr) => arr.some((n) => n.t >= ph * span - 1e-6
            && n.t < (ph + 1) * span - 1e-6);
          return ['lead', 'bass', 'pad', 'counter', 'hue', 'perc']
            .filter((k) => live(s.tracks[k])).length;
        });
      })(),
      /* does the contrast phrase actually lean in? */
      buildAt: s.buildAt,
      swell: (() => {
        const span = s.barsPerPhrase * barDur;
        const b = s.buildAt;
        const inPh = s.tracks.lead.filter((n) => n.t >= b * span && n.t < (b + 1) * span);
        if (inPh.length < 4) return 0;
        const half = Math.floor(inPh.length / 2);
        const mean = (a) => a.reduce((x, n) => x + n.vel, 0) / a.length;
        return +(mean(inPh.slice(half)) / mean(inPh.slice(0, half))).toFixed(2);
      })(),
      returns: first === last,
      cell: s.cell.join(''),
      beats: s.beats,
      metre: `${s.beats}/${s.cell.length}${s.swing ? ` sw${s.swing}` : ''}`,
      motif: s.motif.join(','),
      /* the layers must stay stacked: bass under pad under counter under lead */
      layers: (() => {
        const top = (arr) => (arr.length ? Math.max(...arr.map((n) => n.midi)) : -Infinity);
        const bot = (arr) => (arr.length ? Math.min(...arr.map((n) => n.midi)) : Infinity);
        return {
          padOverLead: top(s.tracks.pad) > bot(s.tracks.lead),
          bassOverPad: top(s.tracks.bass) > bot(s.tracks.pad),
        };
      })(),
      /* does the mode's colour note actually sound? compared as a pitch class,
         because the whole stack is transposed by the character's register */
      colourHeard: p.colour === null ? null : s.tracks.lead.some((n) => n.colour),
      barsPerPhrase: s.barsPerPhrase,
      shortest: +Math.min(...s.tracks.lead
        .filter((n) => !n.grace).map((n) => n.dur)).toFixed(3),
    };
  }));

  structure.forEach((s) => {
    check(`${s.name}: a bar shape repeats`, s.topRepeat >= 3,
      `most common shape appears ${s.topRepeat}× of ${s.bars} bars`);
    check(`${s.name}: the theme is mostly recurring material`, s.recurring >= 0.6,
      `${Math.round(s.recurring * 100)}% of bars reuse a shape`);
    check(`${s.name}: the theme is not all repeats either`,
      s.distinctShapes >= 3, `${s.distinctShapes} distinct shapes`);
    check(`${s.name}: melody sits on the race's grid`, s.onGrid >= 85, `${s.onGrid}%`);
    check(`${s.name}: percussion never lands between slots`, s.percOnGrid >= 99, `${s.percOnGrid}%`);
    /* A kit that only strikes the cell's onsets is the melody again, made of
       noise. Doing more than that means more than one drum, and at least a
       stroke per beat — a dense cell leaves few gaps, so counting gaps alone
       would fail a character whose rhythm is simply busy. */
    check(`${s.name}: the kit does more than double the melody`,
      s.percKinds >= 2 && s.percPerBar >= s.beats,
      `${s.percKinds} sounds, ${s.percPerBar} hits per bar over ${s.beats} beats`);
    check(`${s.name}: the band grows across the theme`,
      s.voicesPerPhrase[0] < s.voicesPerPhrase[s.buildAt], s.voicesPerPhrase.join(' → '));
    check(`${s.name}: the swell phrase leans in`, s.swell >= 1.05,
      `phrase ${s.buildAt + 1}, second half is ${s.swell}× the first`);
    check(`${s.name}: the opening phrase returns at the end`, s.returns);
    check(`${s.name}: the pad stays below the melody`, !s.layers.padOverLead);
    check(`${s.name}: the bass stays below the pad`, !s.layers.bassOverPad);
    check(`${s.name}: no note is a stab`, s.shortest >= 0.16, `shortest ${s.shortest}s`);
    if (s.colourHeard !== null) {
      check(`${s.name}: the mode's colour note is actually sounded`, s.colourHeard);
    }
  });

  const cells = new Set(structure.map((s) => s.cell));
  check('races bring different rhythms', cells.size >= 5, `${cells.size} distinct cells`);
  const metres = new Set(structure.map((s) => s.metre));
  check('races bring different metres', metres.size >= 4,
    `${metres.size} distinct: ${[...metres].join(', ')}`);
  const motifs = new Set(structure.map((s) => s.motif));
  check('every character gets its own motif', motifs.size === structure.length,
    `${motifs.size} distinct of ${structure.length}`);

  /* --- one band, not several soloists --------------------------------
   *
   * The complaint these guard against: some pairings were heard as two or
   * three different tunes running at once rather than as one theme. Three
   * things have to hold for a set of instruments to read as an ensemble. */
  const band = await page.evaluate(() => window.PRESETS.concat(
    /* the awkward combinations are the ones that used to split apart, so a
       few deliberately mismatched sheets are tested alongside the presets */
    [{ name: 'Bright vs Dark', cls: 'warlock', race: 'aasimar', alignment: 'CE',
       traits: ['cheerful'], looks: ['radiant'] },
     { name: 'Loud vs Quiet', cls: 'barbarian', race: 'gnome', alignment: 'LG',
       traits: ['shy'], looks: ['small'] }],
  ).map((ch) => {
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    const bars = Math.round(s.endAt / s.barDur);
    const leadAt = new Set(s.tracks.lead.map((n) => n.t.toFixed(4)));
    const barsWith = (tr) => new Set(tr.map((n) => Math.floor(n.t / s.barDur + 1e-6))).size;
    return {
      name: ch.name,
      hue: p.hue,
      /* every colour-instrument note must be struck together with a melody
         note — that simultaneity is what fuses two instruments into one
         voice instead of leaving them as two lines sharing a room */
      hueWithLead: s.tracks.hue.length
        ? s.tracks.hue.every((n) => leadAt.has(n.t.toFixed(4))) : null,
      /* and it must not be there the whole time: an instrument present in
         every bar is a part, one that arrives for a moment is an accent */
      hueBars: barsWith(s.tracks.hue),
      counterBars: barsWith(s.tracks.counter),
      bars,
      /* nothing accompanying may shine above the melody, or the ear promotes
         it to a tune of its own. The map hands down a ceiling for exactly
         this, so the ceiling must exist wherever the voice is brighter. */
      blend: ['counter', 'hue', 'pad'].map((k) => {
        const v = { counter: p.counter || p.lead, hue: p.hue || p.lead, pad: p.pad }[k];
        const V = window.Leitmotif.VOICES;
        const over = V[v] && V[p.lead] ? V[v].bright - V[p.lead].bright : 0;
        return { k, over: +over.toFixed(2), tone: Math.round(p.blend[k].tone),
                 gain: +p.blend[k].gain.toFixed(2) };
      }),
    };
  }));

  band.forEach((s) => {
    if (s.hueWithLead !== null) {
      check(`${s.name}: the colour instrument doubles the melody`, s.hueWithLead);
      check(`${s.name}: the colour instrument comes and goes`,
        s.hueBars < s.bars * 0.6, `${s.hueBars} bars of ${s.bars}`);
    }
    if (s.counterBars) {
      check(`${s.name}: the second voice comes and goes`,
        s.counterBars < s.bars, `${s.counterBars} bars of ${s.bars}`);
    }
    s.blend.forEach((b) => {
      if (b.over > 0.02) {
        check(`${s.name}: the ${b.k} is capped below the melody`,
          b.tone > 0 && b.tone < 9000, `brighter by ${b.over}, ceiling ${b.tone}Hz`);
      }
      check(`${s.name}: the ${b.k} trim stays usable`,
        b.gain >= 0.55 && b.gain <= 1, `gain ${b.gain}`);
    });
  });

  /* Two characters of the same class must be relatives, not twins: the same
     allowed intervals and direction, a different tune. */
  const kin = await page.evaluate(() => {
    const a = { name: 'A', cls: 'paladin', race: 'human', alignment: 'LG', traits: ['brave'], looks: ['old'] };
    const b = { name: 'B', cls: 'paladin', race: 'human', alignment: 'LG', traits: ['brave'], looks: ['old'] };
    const pa = window.Leitmotif.characterToParams(a);
    const pb = window.Leitmotif.characterToParams(b);
    const dir = (m) => Math.sign(m[m.length - 1]);
    return { same: pa.motif.join() === pb.motif.join(), sameDir: dir(pa.motif) === dir(pb.motif) };
  });
  check('two paladins are not twins', !kin.same);
  check('two paladins are still relatives', kin.sameDir);

  /* --- determinism --------------------------------------------------- */
  const twice = await page.evaluate(() => {
    const ch = window.PRESETS[0];
    const a = window.Leitmotif.composeScore(window.Leitmotif.characterToParams(ch));
    const b = window.Leitmotif.composeScore(window.Leitmotif.characterToParams(ch));
    return JSON.stringify(a) === JSON.stringify(b);
  });
  check('same character renders the same score twice', twice);

  const changed = await page.evaluate(() => {
    const base = window.PRESETS[0];
    const shy = { ...base, traits: ['shy'] };
    const a = window.Leitmotif.composeScore(window.Leitmotif.characterToParams(base));
    const b = window.Leitmotif.composeScore(window.Leitmotif.characterToParams(shy));
    return JSON.stringify(a) !== JSON.stringify(b);
  });
  check('changing one trait changes the score', changed);

  /* --- the complaints, as numbers ------------------------------------
   *
   * These are not "is it good" — no number says that. They say "is this still
   * the thing you objected to", which is what lets a fix be checked before it
   * reaches you rather than after. metrics.js explains each one.
   *
   * The bounds are set from what the current version actually measures, with
   * room to move: they are a tripwire against sliding back, not a target. */
  const felt = await page.evaluate(() => window.PRESETS.map((ch) => {
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    return { name: ch.name, ...window.Metrics.report(s, p) };
  }));

  /* Nothing open at the moment. Ogrim's second voice was the last entry: it now
     answers in the lead's own instrument, decided by ear on the A/B page, and
     the timing measure that flagged it reads it as part of the tune once the
     shared timbre is taken into account. */
  const OPEN = {};

  felt.forEach((f) => {
    /* «несколько разных мелодий». The second voice and the race's instrument
       are held to one bound and the pad to a looser one: sounding continuously
       is the pad's job, so the same number does not mean the same thing. */
    const bound = OPEN[f.name] || 0.55;
    const voices = Math.max(f.apartCounter, f.apartHue);
    (OPEN[f.name] ? watch : check)(`${f.name}: nothing plays a second tune`,
      voices <= bound,
      `second voice ${f.apartCounter}, colour ${f.apartHue}`
      + `${OPEN[f.name] ? ` (open question, bound ${bound})` : ''}`);
    check(`${f.name}: the pad stays a floor, not a tune`, f.apartPad <= 0.7,
      `pad moves against the melody ${Math.round(f.apartPad * 100)}% of the time`);
    /* «механическая составляющая»: one spacing and one weight throughout */
    check(`${f.name}: the melody is not metronomic`, f.machine <= 0.75,
      `${Math.round(f.step * 100)}% at one spacing, weight flatness ${f.flat}`);
    /* «рваная линия»: holes punched inside a phrase */
    check(`${f.name}: the melody is not torn`, f.hole <= 0.45,
      `${Math.round(f.hole * 100)}% of its span silent, longest hole ${f.longestHole}s`);
  });

  if (!FULL) {
    console.log('\n  skipped (audio, needs --full): loudness, clipping, brightness,'
      + ' wobble, render determinism\n');
  }

  /* --- the audio itself ---------------------------------------------- */
  const audio = !FULL ? [] : await page.evaluate(async () => {
    const out = [];
    for (const ch of window.PRESETS) {
      const buf = await window.Leitmotif.renderOffline(ch);
      const d = buf.getChannelData(0);
      let sum = 0; let peak = 0; let cross = 0;
      for (let i = 0; i < d.length; i += 1) {
        sum += d[i] * d[i];
        if (Math.abs(d[i]) > peak) peak = Math.abs(d[i]);
        if (i && ((d[i] >= 0) !== (d[i - 1] >= 0))) cross += 1;
      }
      out.push({
        name: ch.name,
        seconds: +(buf.length / buf.sampleRate).toFixed(1),
        rms: +Math.sqrt(sum / d.length).toFixed(4),
        peak: +peak.toFixed(3),
        /* zero crossings per second is a crude but honest brightness measure */
        bright: Math.round(cross / (buf.length / buf.sampleRate)),
        /* «мусор», «колебания» — see metrics.js */
        wobble: window.Metrics.wobble(buf),
      });
    }
    return out;
  });

  audio.forEach((a) => {
    check(`${a.name}: audio is not silent`, a.rms > 0.005, `rms ${a.rms}`);
    check(`${a.name}: audio does not clip`, a.peak <= 1.0, `peak ${a.peak}`);
    /* «мусор», «колебания». Today the twelve sit between 0.05 and 0.17, so the
       bound is set above the worst of them with room: it catches something new
       starting to warble, not the ordinary movement of a theme. */
    check(`${a.name}: nothing warbles`, a.wobble <= 0.24, `wobble ${a.wobble}`);
  });

  if (FULL) {
    const brights = audio.map((a) => a.bright);
    check('brightness differs across characters',
      Math.max(...brights) - Math.min(...brights) > 200,
      `${Math.min(...brights)} … ${Math.max(...brights)}`);

    const uniqueRms = new Set(audio.map((a) => a.rms)).size;
    check('every character renders distinct audio', uniqueRms === audio.length,
      `${uniqueRms}/${audio.length} distinct`);

    const loud = audio.map((a) => a.rms);
    const spread = Math.max(...loud) / Math.min(...loud);
    check('no character is drowned out by another', spread <= 3.0,
      `loudest is ${spread.toFixed(1)}× the quietest`);
  }

  /* The performance layer adds a few milliseconds and a few cents to every
     note, so it is worth proving the untidiness is composed rather than random.
     Bit-exactness is not available — the limiter accumulates differently across
     a minute of audio — but the difference has to stay far below hearing. */
  const steady = !FULL ? 0 : await page.evaluate(async () => {
    const ch = window.PRESETS[0];
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    const rate = 44100;
    const render = async () => {
      const c = new OfflineAudioContext(2, Math.ceil(rate * s.duration), rate);
      window.Music.renderScore(c, s, p, 0);
      return (await c.startRendering()).getChannelData(0);
    };
    const x = await render();
    const y = await render();
    let worst = 0;
    for (let i = 0; i < x.length; i += 1) worst = Math.max(worst, Math.abs(x[i] - y[i]));
    return +worst.toFixed(6);
  });
  if (FULL) {
    check('the same sheet performs the same way', steady < 0.001,
      `worst sample differs by ${steady}`);
  }

  /* Taking a part out must take out that part and nothing else.
   *
   * It did not. Every part used to draw its performance jitter from one shared
   * stream, handed out in track order, so deleting the second voice's notes
   * shifted every draw belonging to the pad, the bass and the drums — the whole
   * band was re-performed from the first bar. It made A/B comparisons
   * meaningless, and it meant any edit to a note count quietly reshuffled the
   * feel of everything downstream.
   *
   * The audio before the removed part's first note must now be untouched. */
  const isolated = !FULL ? null : await page.evaluate(async () => {
    const ch = window.PRESETS.find((c) => c.name === 'Ogrim Stoneback');
    const p = window.Leitmotif.characterToParams(ch);
    const rate = 44100;
    const render = async (s) => {
      const c = new OfflineAudioContext(2, Math.ceil(rate * s.duration), rate);
      window.Music.renderScore(c, s, p, 0);
      return (await c.startRendering()).getChannelData(0);
    };
    const base = window.Leitmotif.composeScore(p);
    const cut = window.Leitmotif.composeScore(p);
    const entersAt = cut.tracks.counter.length ? cut.tracks.counter[0].t : 0;
    cut.tracks.counter.length = 0;
    const [x, y] = [await render(base), await render(cut)];
    let worst = 0;
    for (let i = 0; i < Math.floor(entersAt * rate); i += 1) {
      worst = Math.max(worst, Math.abs(x[i] - y[i]));
    }
    return { entersAt: +entersAt.toFixed(1), worst: +worst.toFixed(6) };
  });
  if (FULL) {
    check('removing a part leaves the others alone',
      isolated.worst < 0.001,
      `before the second voice enters at ${isolated.entersAt}s,`
      + ` worst sample differs by ${isolated.worst}`);
  }

  /* --- the ending ---------------------------------------------------- */
  const endings = await page.evaluate(() => window.PRESETS.map((ch) => {
    const p = window.Leitmotif.characterToParams(ch);
    const s = window.Leitmotif.composeScore(p);
    const at = (arr) => arr.filter((n) => Math.abs(n.t - s.endAt) < 0.01).length;
    return {
      name: ch.name,
      together: at(s.tracks.lead) + at(s.tracks.pad) + at(s.tracks.bass),
      gong: s.tracks.perc.some((h) => h.kind === 'gong'),
      abrupt: s.abrupt,
      tail: +(s.duration - s.endAt).toFixed(1),
    };
  }));
  endings.forEach((e) => {
    check(`${e.name}: the ending lands together`, e.together >= 4,
      `${e.together} parts strike the final chord`);
    /* an abrupt character is meant to stop dead; everyone else rings out */
    if (e.abrupt) {
      check(`${e.name}: the ending is cut short`, e.tail <= 1.6 && !e.gong, `${e.tail}s`);
    } else {
      check(`${e.name}: there is room for the chord to ring`, e.tail >= 3, `${e.tail}s`);
    }
  });

  /* --- the page at 390px --------------------------------------------- */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('no sideways scroll at 390px', overflow <= 0, `${overflow}px overflow`);
  const smallButtons = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => b.getBoundingClientRect().height < 44).length);
  check('every button is at least 44px tall', smallButtons === 0, `${smallButtons} too small`);

  await browser.close();

  console.table(scores);
  console.table(felt);
  if (FULL) console.table(audio);
  ok.forEach((n) => console.log('  ok   ', n));
  open.forEach((n) => console.log('  open ', n));
  fail.forEach((n) => console.log('  FAIL ', n));
  console.log(`\n${ok.length} passed, ${fail.length} failed`
    + `${open.length ? `, ${open.length} open` : ''}`
    + `${FULL ? '' : ' — score only, run --full before publishing'}`);
  process.exit(fail.length ? 1 : 0);
})();
