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
  check('six cards rendered', await page.locator('.card').count() === 6);

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
    check(`${s.name}: theme is 30-60s`, s.duration >= 30 && s.duration <= 60, `${s.duration}s`);
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
    const beat = 60 / p.tempo;
    const barDur = beat * 4;
    const slot = barDur / 8;

    /* signature of a bar = its melodic shape, independent of where it sits */
    const bars = {};
    s.tracks.lead.forEach((n) => {
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

    /* everything should sit on the race's grid */
    const onGrid = s.tracks.lead.filter((n) => {
      const pos = Math.round((n.t % barDur) / slot);
      return Math.abs(n.t % barDur - pos * slot) < 0.002 && s.cell[pos % 8] > 0;
    }).length;
    const percOnGrid = s.tracks.perc.filter((h) => {
      const pos = Math.round((h.t % barDur) / slot);
      return Math.abs(h.t % barDur - pos * slot) < 0.002 && s.cell[pos % 8] > 0;
    }).length;

    /* The opening phrase should return at the end: A A' B A''. The very last
       bar is excluded — it carries the final cadence and is meant to differ. */
    const first = sigs.slice(0, 3).join('|');
    const last = sigs.slice(12, 15).join('|');

    /* how much of the theme is built from material that occurs more than once */
    const recurring = sigs.filter((s) => counts[s] > 1).length / sigs.length;

    return {
      name: ch.name, bars: sigs.length, topRepeat,
      recurring: +recurring.toFixed(2),
      distinctShapes: Object.keys(counts).length,
      onGrid: Math.round(100 * onGrid / s.tracks.lead.length),
      percOnGrid: s.tracks.perc.length
        ? Math.round(100 * percOnGrid / s.tracks.perc.length) : 100,
      returns: first === last,
      cell: s.cell.join(''),
      motif: s.motif.join(','),
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
    check(`${s.name}: percussion sits on the same grid`, s.percOnGrid >= 95, `${s.percOnGrid}%`);
    check(`${s.name}: the opening phrase returns at the end`, s.returns);
  });

  const cells = new Set(structure.map((s) => s.cell));
  check('races bring different rhythms', cells.size >= 5, `${cells.size} distinct cells`);
  const motifs = new Set(structure.map((s) => s.motif));
  check('classes bring different motifs', motifs.size === 6, `${motifs.size} distinct motifs`);

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
