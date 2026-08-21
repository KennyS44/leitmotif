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
