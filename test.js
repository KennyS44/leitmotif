'use strict';

/* Prototype check. The interesting assertion is not "does it play" but
   "do six different sheets produce six measurably different pieces of audio".
   Everything is rendered offline, so no sound card is involved. */

const { chromium } = require('/usr/local/lib/node_modules/playwright');

const fail = [];
const ok = [];
function check(name, cond, detail) {
  (cond ? ok : fail).push(detail ? `${name} — ${detail}` : name);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:20302/', { waitUntil: 'load' });
  await page.waitForTimeout(300);

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

  /* --- the audio itself ---------------------------------------------- */
  const audio = await page.evaluate(async () => {
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
      });
    }
    return out;
  });

  audio.forEach((a) => {
    check(`${a.name}: audio is not silent`, a.rms > 0.005, `rms ${a.rms}`);
    check(`${a.name}: audio does not clip`, a.peak <= 1.0, `peak ${a.peak}`);
  });

  const brights = audio.map((a) => a.bright);
  check('brightness differs across characters',
    Math.max(...brights) - Math.min(...brights) > 200,
    `${Math.min(...brights)} … ${Math.max(...brights)}`);

  /* The performance layer adds a few milliseconds and a few cents to every
     note, so it is worth proving the untidiness is composed rather than random.
     Bit-exactness is not available — the limiter accumulates differently across
     a minute of audio — but the difference has to stay far below hearing. */
  const steady = await page.evaluate(async () => {
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
  check('the same sheet performs the same way', steady < 0.001,
    `worst sample differs by ${steady}`);

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

  const uniqueRms = new Set(audio.map((a) => a.rms)).size;
  check('every character renders distinct audio', uniqueRms === audio.length,
    `${uniqueRms}/${audio.length} distinct`);

  const loud = audio.map((a) => a.rms);
  const spread = Math.max(...loud) / Math.min(...loud);
  check('no character is drowned out by another', spread <= 3.0,
    `loudest is ${spread.toFixed(1)}× the quietest`);

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
  console.table(audio);
  ok.forEach((n) => console.log('  ok   ', n));
  fail.forEach((n) => console.log('  FAIL ', n));
  console.log(`\n${ok.length} passed, ${fail.length} failed`);
  process.exit(fail.length ? 1 : 0);
})();
